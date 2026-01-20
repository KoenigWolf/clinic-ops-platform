"use client";

import { Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AudiogramChart, getHearingLevel, calculateFourFrequencyAverage } from "@/components/ent/audiogram-chart";
import { EmptyState } from "@/components/layout";
import { labels } from "@/lib/labels";

const { common } = labels;

function ReportContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";
  const testId = searchParams.get("testId") ?? "";
  const reportRef = useRef<HTMLDivElement>(null);

  const {
    data: patient,
    isLoading: patientLoading,
    isError: patientError,
    refetch: refetchPatient,
  } = trpc.patient.get.useQuery(
    { id: patientId },
    { enabled: !!patientId }
  );

  const {
    data: test,
    isLoading: testLoading,
    isError: testError,
    refetch: refetchTest,
  } = trpc.ent.audiometry.get.useQuery(
    { id: testId },
    { enabled: !!testId }
  );

  const handlePrint = () => {
    window.print();
  };

  if (!patientId || !testId) {
    return <EmptyState message={common.loadFailed} />;
  }

  if (patientError || testError) {
    return (
      <EmptyState
        message={common.loadFailed}
        action={
          <Button type="button" variant="outline" onClick={() => {
            refetchPatient();
            refetchTest();
          }}>
            {common.retry}
          </Button>
        }
      />
    );
  }

  if (patientLoading || testLoading || !test || !patient) {
    return (
      <div className="p-8 text-center text-gray-500">
        {common.loading}
      </div>
    );
  }

  const rightAvg = calculateFourFrequencyAverage(
    test.rightAir500,
    test.rightAir1000,
    test.rightAir2000,
    test.rightAir4000
  );
  const leftAvg = calculateFourFrequencyAverage(
    test.leftAir500,
    test.leftAir1000,
    test.leftAir2000,
    test.leftAir4000
  );
  const rightLevel = rightAvg !== null ? getHearingLevel(rightAvg) : null;
  const leftLevel = leftAvg !== null ? getHearingLevel(leftAvg) : null;

  return (
    <div>
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link href="/ent">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          印刷
        </Button>
      </div>

      {/* Report Content */}
      <div
        id="report-content"
        ref={reportRef}
        className="bg-white p-8 print:p-4 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center">聴力検査報告書</h1>
          <p className="text-center text-gray-600 mt-1">Audiometry Test Report</p>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-24 text-gray-600">患者番号:</span>
              <span className="font-medium">{patient.patientNumber}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-600">氏名:</span>
              <span className="font-medium">
                {patient.lastName} {patient.firstName}
              </span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-600">生年月日:</span>
              <span className="font-medium">
                {new Date(patient.dateOfBirth).toLocaleDateString("ja-JP")}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex">
              <span className="w-24 text-gray-600">検査日:</span>
              <span className="font-medium">
                {new Date(test.testDate).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-600">検査種類:</span>
              <span className="font-medium">
                {test.testType === "PURE_TONE" ? "純音聴力検査" : test.testType}
              </span>
            </div>
          </div>
        </div>

        {/* Audiogram */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-1">オージオグラム</h2>
          <div className="flex justify-center">
            <AudiogramChart data={test} width={480} height={360} />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-1">検査結果サマリー</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Right Ear */}
            <div className="p-4 bg-red-50 rounded-lg print:border print:border-red-200 print:bg-white">
              <h3 className="font-semibold text-red-700 mb-3">右耳 (Right)</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600">4分法平均:</td>
                    <td className="py-1 font-medium">
                      {rightAvg !== null ? `${rightAvg.toFixed(1)} dB` : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">聴力レベル:</td>
                    <td className="py-1 font-medium">
                      {rightLevel ? rightLevel.level : "-"}
                    </td>
                  </tr>
                  {test.rightSpeechDiscrimination !== null && (
                    <tr>
                      <td className="py-1 text-gray-600">語音弁別能:</td>
                      <td className="py-1 font-medium">
                        {test.rightSpeechDiscrimination}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Frequency breakdown */}
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-gray-500 mb-1">周波数別聴力値 (dB)</p>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div>250Hz: {test.rightAir250 ?? "-"}</div>
                  <div>500Hz: {test.rightAir500 ?? "-"}</div>
                  <div>1kHz: {test.rightAir1000 ?? "-"}</div>
                  <div>2kHz: {test.rightAir2000 ?? "-"}</div>
                  <div>4kHz: {test.rightAir4000 ?? "-"}</div>
                  <div>8kHz: {test.rightAir8000 ?? "-"}</div>
                </div>
              </div>
            </div>

            {/* Left Ear */}
            <div className="p-4 bg-blue-50 rounded-lg print:border print:border-blue-200 print:bg-white">
              <h3 className="font-semibold text-blue-700 mb-3">左耳 (Left)</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600">4分法平均:</td>
                    <td className="py-1 font-medium">
                      {leftAvg !== null ? `${leftAvg.toFixed(1)} dB` : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">聴力レベル:</td>
                    <td className="py-1 font-medium">
                      {leftLevel ? leftLevel.level : "-"}
                    </td>
                  </tr>
                  {test.leftSpeechDiscrimination !== null && (
                    <tr>
                      <td className="py-1 text-gray-600">語音弁別能:</td>
                      <td className="py-1 font-medium">
                        {test.leftSpeechDiscrimination}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Frequency breakdown */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-500 mb-1">周波数別聴力値 (dB)</p>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div>250Hz: {test.leftAir250 ?? "-"}</div>
                  <div>500Hz: {test.leftAir500 ?? "-"}</div>
                  <div>1kHz: {test.leftAir1000 ?? "-"}</div>
                  <div>2kHz: {test.leftAir2000 ?? "-"}</div>
                  <div>4kHz: {test.leftAir4000 ?? "-"}</div>
                  <div>8kHz: {test.leftAir8000 ?? "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        {test.interpretation && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b pb-1">所見・コメント</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{test.interpretation}</p>
          </div>
        )}

        {/* Hearing Level Reference */}
        <div className="mb-6 text-sm">
          <h2 className="text-lg font-semibold mb-3 border-b pb-1">聴力レベル基準</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="border p-2 text-left">レベル</th>
                <th className="border p-2 text-left">聴力閾値</th>
                <th className="border p-2 text-left">説明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">正常</td>
                <td className="border p-2">25 dB 以下</td>
                <td className="border p-2">日常会話に支障なし</td>
              </tr>
              <tr>
                <td className="border p-2">軽度難聴</td>
                <td className="border p-2">26-40 dB</td>
                <td className="border p-2">小声や遠くの声が聞き取りにくい</td>
              </tr>
              <tr>
                <td className="border p-2">中等度難聴</td>
                <td className="border p-2">41-55 dB</td>
                <td className="border p-2">普通の会話が聞き取りにくい</td>
              </tr>
              <tr>
                <td className="border p-2">準重度難聴</td>
                <td className="border p-2">56-70 dB</td>
                <td className="border p-2">大きな声でないと聞き取れない</td>
              </tr>
              <tr>
                <td className="border p-2">重度難聴</td>
                <td className="border p-2">71-90 dB</td>
                <td className="border p-2">耳元の大声でないと聞き取れない</td>
              </tr>
              <tr>
                <td className="border p-2">最重度難聴</td>
                <td className="border p-2">91 dB 以上</td>
                <td className="border p-2">補聴器でも聞き取り困難</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 mt-8 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>発行日: {new Date().toLocaleDateString("ja-JP")}</span>
            <span>Karute 電子カルテシステム</span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">{common.loading}</div>}>
      <ReportContent />
    </Suspense>
  );
}
