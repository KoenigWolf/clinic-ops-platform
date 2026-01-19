"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AudiometryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  testId: string | null;
  onSuccess: () => void;
}

const FREQUENCIES = ["125", "250", "500", "1000", "2000", "4000", "8000"];
const BONE_FREQUENCIES = ["250", "500", "1000", "2000", "4000"];

export function AudiometryDialog({
  open,
  onOpenChange,
  patientId,
  testId,
  onSuccess,
}: AudiometryDialogProps) {
  const [testType, setTestType] = useState("PURE_TONE");
  const [interpretation, setInterpretation] = useState("");

  // Air conduction
  const [rightAir, setRightAir] = useState<Record<string, string>>({});
  const [leftAir, setLeftAir] = useState<Record<string, string>>({});

  // Bone conduction
  const [rightBone, setRightBone] = useState<Record<string, string>>({});
  const [leftBone, setLeftBone] = useState<Record<string, string>>({});

  // Speech discrimination
  const [rightSpeech, setRightSpeech] = useState("");
  const [leftSpeech, setLeftSpeech] = useState("");

  const { data: existingTest } = trpc.ent.audiometry.get.useQuery(
    { id: testId! },
    { enabled: !!testId }
  );

  const createMutation = trpc.ent.audiometry.create.useMutation({
    onSuccess: () => {
      toast.success("聴力検査を保存しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.ent.audiometry.update.useMutation({
    onSuccess: () => {
      toast.success("聴力検査を更新しました");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (existingTest) {
      setTestType(existingTest.testType);
      setInterpretation(existingTest.interpretation || "");

      // Load air conduction values
      setRightAir({
        "125": existingTest.rightAir125?.toString() || "",
        "250": existingTest.rightAir250?.toString() || "",
        "500": existingTest.rightAir500?.toString() || "",
        "1000": existingTest.rightAir1000?.toString() || "",
        "2000": existingTest.rightAir2000?.toString() || "",
        "4000": existingTest.rightAir4000?.toString() || "",
        "8000": existingTest.rightAir8000?.toString() || "",
      });
      setLeftAir({
        "125": existingTest.leftAir125?.toString() || "",
        "250": existingTest.leftAir250?.toString() || "",
        "500": existingTest.leftAir500?.toString() || "",
        "1000": existingTest.leftAir1000?.toString() || "",
        "2000": existingTest.leftAir2000?.toString() || "",
        "4000": existingTest.leftAir4000?.toString() || "",
        "8000": existingTest.leftAir8000?.toString() || "",
      });

      // Load bone conduction values
      setRightBone({
        "250": existingTest.rightBone250?.toString() || "",
        "500": existingTest.rightBone500?.toString() || "",
        "1000": existingTest.rightBone1000?.toString() || "",
        "2000": existingTest.rightBone2000?.toString() || "",
        "4000": existingTest.rightBone4000?.toString() || "",
      });
      setLeftBone({
        "250": existingTest.leftBone250?.toString() || "",
        "500": existingTest.leftBone500?.toString() || "",
        "1000": existingTest.leftBone1000?.toString() || "",
        "2000": existingTest.leftBone2000?.toString() || "",
        "4000": existingTest.leftBone4000?.toString() || "",
      });

      setRightSpeech(existingTest.rightSpeechDiscrimination?.toString() || "");
      setLeftSpeech(existingTest.leftSpeechDiscrimination?.toString() || "");
    } else {
      // Reset form
      setTestType("PURE_TONE");
      setInterpretation("");
      setRightAir({});
      setLeftAir({});
      setRightBone({});
      setLeftBone({});
      setRightSpeech("");
      setLeftSpeech("");
    }
  }, [existingTest, testId, open]);

  const parseNum = (val: string): number | null => {
    const num = parseInt(val);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = () => {
    const data = {
      patientId,
      testType: testType as "PURE_TONE" | "SPEECH" | "IMPEDANCE" | "OAE" | "ABR",
      interpretation: interpretation || undefined,
      // Right air
      rightAir125: parseNum(rightAir["125"]),
      rightAir250: parseNum(rightAir["250"]),
      rightAir500: parseNum(rightAir["500"]),
      rightAir1000: parseNum(rightAir["1000"]),
      rightAir2000: parseNum(rightAir["2000"]),
      rightAir4000: parseNum(rightAir["4000"]),
      rightAir8000: parseNum(rightAir["8000"]),
      // Left air
      leftAir125: parseNum(leftAir["125"]),
      leftAir250: parseNum(leftAir["250"]),
      leftAir500: parseNum(leftAir["500"]),
      leftAir1000: parseNum(leftAir["1000"]),
      leftAir2000: parseNum(leftAir["2000"]),
      leftAir4000: parseNum(leftAir["4000"]),
      leftAir8000: parseNum(leftAir["8000"]),
      // Right bone
      rightBone250: parseNum(rightBone["250"]),
      rightBone500: parseNum(rightBone["500"]),
      rightBone1000: parseNum(rightBone["1000"]),
      rightBone2000: parseNum(rightBone["2000"]),
      rightBone4000: parseNum(rightBone["4000"]),
      // Left bone
      leftBone250: parseNum(leftBone["250"]),
      leftBone500: parseNum(leftBone["500"]),
      leftBone1000: parseNum(leftBone["1000"]),
      leftBone2000: parseNum(leftBone["2000"]),
      leftBone4000: parseNum(leftBone["4000"]),
      // Speech
      rightSpeechDiscrimination: parseNum(rightSpeech),
      leftSpeechDiscrimination: parseNum(leftSpeech),
    };

    if (testId) {
      updateMutation.mutate({ id: testId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{testId ? "聴力検査の編集" : "新規聴力検査"}</DialogTitle>
          <DialogDescription>
            純音聴力検査（オージオグラム）の結果を入力してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Type */}
          <div className="space-y-2">
            <Label>検査種類</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PURE_TONE">純音聴力検査</SelectItem>
                <SelectItem value="SPEECH">語音聴力検査</SelectItem>
                <SelectItem value="OAE">耳音響放射</SelectItem>
                <SelectItem value="ABR">聴性脳幹反応</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Air/Bone Conduction Tabs */}
          <Tabs defaultValue="air" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="air">気導聴力</TabsTrigger>
              <TabsTrigger value="bone">骨導聴力</TabsTrigger>
            </TabsList>

            <TabsContent value="air" className="space-y-4">
              {/* Right Ear Air Conduction */}
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-3">右耳（気導）</h4>
                <div className="grid grid-cols-7 gap-2">
                  {FREQUENCIES.map((freq) => (
                    <div key={freq} className="text-center">
                      <Label className="text-xs">{freq}Hz</Label>
                      <Input
                        type="number"
                        value={rightAir[freq] || ""}
                        onChange={(e) => setRightAir({ ...rightAir, [freq]: e.target.value })}
                        className="mt-1 text-center"
                        placeholder="dB"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Left Ear Air Conduction */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-3">左耳（気導）</h4>
                <div className="grid grid-cols-7 gap-2">
                  {FREQUENCIES.map((freq) => (
                    <div key={freq} className="text-center">
                      <Label className="text-xs">{freq}Hz</Label>
                      <Input
                        type="number"
                        value={leftAir[freq] || ""}
                        onChange={(e) => setLeftAir({ ...leftAir, [freq]: e.target.value })}
                        className="mt-1 text-center"
                        placeholder="dB"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bone" className="space-y-4">
              {/* Right Ear Bone Conduction */}
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-3">右耳（骨導）</h4>
                <div className="grid grid-cols-5 gap-2">
                  {BONE_FREQUENCIES.map((freq) => (
                    <div key={freq} className="text-center">
                      <Label className="text-xs">{freq}Hz</Label>
                      <Input
                        type="number"
                        value={rightBone[freq] || ""}
                        onChange={(e) => setRightBone({ ...rightBone, [freq]: e.target.value })}
                        className="mt-1 text-center"
                        placeholder="dB"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Left Ear Bone Conduction */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-3">左耳（骨導）</h4>
                <div className="grid grid-cols-5 gap-2">
                  {BONE_FREQUENCIES.map((freq) => (
                    <div key={freq} className="text-center">
                      <Label className="text-xs">{freq}Hz</Label>
                      <Input
                        type="number"
                        value={leftBone[freq] || ""}
                        onChange={(e) => setLeftBone({ ...leftBone, [freq]: e.target.value })}
                        className="mt-1 text-center"
                        placeholder="dB"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Speech Discrimination */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>右耳 語音弁別能 (%)</Label>
              <Input
                type="number"
                value={rightSpeech}
                onChange={(e) => setRightSpeech(e.target.value)}
                placeholder="0-100"
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>左耳 語音弁別能 (%)</Label>
              <Input
                type="number"
                value={leftSpeech}
                onChange={(e) => setLeftSpeech(e.target.value)}
                placeholder="0-100"
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* Interpretation */}
          <div className="space-y-2">
            <Label>所見・解釈</Label>
            <Textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="検査結果の所見を入力..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
