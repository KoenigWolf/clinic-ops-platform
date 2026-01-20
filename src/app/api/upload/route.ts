import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, unlink, stat } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Security constants
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_BASE_DIR = "uploads";
const UPLOAD_SUBDIR = "endoscopy";

// Validate and sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string | null {
  // Remove any path separators and null bytes
  const sanitized = filename
    .replace(/[\\/\0]/g, "")
    .replace(/\.\./g, "");

  // Only allow alphanumeric, underscore, hyphen, and single dots
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(sanitized)) {
    return null;
  }

  // Ensure it doesn't start with a dot (hidden files)
  if (sanitized.startsWith(".")) {
    return null;
  }

  return sanitized;
}

// Validate file extension matches MIME type
function validateFileExtension(filename: string, mimeType: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return false;
  }

  // Cross-validate extension with MIME type
  const mimeExtMap: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
  };

  return mimeExtMap[mimeType]?.includes(ext) ?? false;
}

// Generate cryptographically secure filename
function generateSecureFilename(extension: string): string {
  const randomPart = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}_${randomPart}.${extension}`;
}

// Validate file is within allowed directory (prevent path traversal)
function isPathWithinDirectory(filePath: string, directory: string): boolean {
  const resolvedPath = path.resolve(filePath);
  const resolvedDirectory = path.resolve(directory);
  return resolvedPath.startsWith(resolvedDirectory + path.sep);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Role-based access control - only staff can upload
    if (!["ADMIN", "DOCTOR", "NURSE", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const patientId = formData.get("patientId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });
    }

    // Validate MIME type (check header, not just extension)
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "無効なファイル形式です。JPEG、PNG、WebP、GIFのみ許可されています。" },
        { status: 400 }
      );
    }

    // Validate file extension matches MIME type
    if (!validateFileExtension(file.name, file.type)) {
      return NextResponse.json(
        { error: "ファイル拡張子がMIMEタイプと一致しません" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズが大きすぎます。最大10MBまでです。" },
        { status: 400 }
      );
    }

    // Validate patientId format if provided (CUID format)
    if (patientId && !/^c[a-z0-9]{24,}$/i.test(patientId)) {
      return NextResponse.json(
        { error: "無効な患者IDです" },
        { status: 400 }
      );
    }

    // Read file content and verify magic bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify magic bytes for image types
    const magicBytes = buffer.subarray(0, 8);
    const isValidMagic = (
      // JPEG: FF D8 FF
      (file.type === "image/jpeg" && magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) ||
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      (file.type === "image/png" && magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) ||
      // GIF: 47 49 46 38
      (file.type === "image/gif" && magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x38) ||
      // WebP: 52 49 46 46 ... 57 45 42 50
      (file.type === "image/webp" && magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x46)
    );

    if (!isValidMagic) {
      return NextResponse.json(
        { error: "ファイル内容がMIMEタイプと一致しません" },
        { status: 400 }
      );
    }

    // Generate secure filename (don't use user-provided filename)
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const secureFilename = generateSecureFilename(ext);

    // Construct upload path safely
    const uploadDir = path.join(process.cwd(), "public", UPLOAD_BASE_DIR, UPLOAD_SUBDIR);
    const filePath = path.join(uploadDir, secureFilename);

    // Verify path is within upload directory
    if (!isPathWithinDirectory(filePath, uploadDir)) {
      return NextResponse.json(
        { error: "無効なファイルパスです" },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    // Write file
    await writeFile(filePath, buffer);

    // Return the URL to access the file
    const url = `/${UPLOAD_BASE_DIR}/${UPLOAD_SUBDIR}/${secureFilename}`;

    return NextResponse.json({
      success: true,
      url,
      filename: secureFilename,
    });
  } catch {
    // Don't log or expose error details - security best practice
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Role-based access control
    if (!["ADMIN", "DOCTOR", "NURSE", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "ファイル名が指定されていません" }, { status: 400 });
    }

    // Sanitize and validate filename
    const sanitizedFilename = sanitizeFilename(filename);
    if (!sanitizedFilename) {
      return NextResponse.json({ error: "無効なファイル名です" }, { status: 400 });
    }

    // Construct path safely
    const uploadDir = path.join(process.cwd(), "public", UPLOAD_BASE_DIR, UPLOAD_SUBDIR);
    const filePath = path.join(uploadDir, sanitizedFilename);

    // CRITICAL: Verify path is within upload directory (prevent path traversal)
    if (!isPathWithinDirectory(filePath, uploadDir)) {
      return NextResponse.json({ error: "無効なファイルパスです" }, { status: 400 });
    }

    // Check if file exists and is a regular file (not a directory or symlink)
    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        return NextResponse.json({ error: "無効なファイルです" }, { status: 400 });
      }
    } catch {
      // File doesn't exist - return success (idempotent delete)
      return NextResponse.json({ success: true });
    }

    await unlink(filePath);

    return NextResponse.json({ success: true });
  } catch {
    // Don't log or expose error details
    return NextResponse.json(
      { error: "削除に失敗しました" },
      { status: 500 }
    );
  }
}
