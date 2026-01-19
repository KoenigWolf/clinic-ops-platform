"use client";

import { useEffect, useCallback, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Settings,
  Users,
  MessageSquare,
} from "lucide-react";

interface VideoRoomProps {
  roomUrl: string;
  token: string | null;
  onLeave: () => void;
}

export function VideoRoom({ roomUrl, token, onLeave }: VideoRoomProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkQuality, setNetworkQuality] = useState<"good" | "poor" | "unknown">("unknown");

  // Initialize Daily.co
  useEffect(() => {
    if (!roomUrl) return;

    const daily = DailyIframe.createCallObject({
      url: roomUrl,
      token: token || undefined,
    });

    setCallObject(daily);

    // Event handlers
    daily.on("joined-meeting", () => {
      setIsJoining(false);
      updateParticipantCount(daily);
    });

    daily.on("left-meeting", () => {
      onLeave();
    });

    daily.on("participant-joined", () => {
      updateParticipantCount(daily);
    });

    daily.on("participant-left", () => {
      updateParticipantCount(daily);
    });

    daily.on("error", (event) => {
      console.error("Daily error:", event);
      setError("接続エラーが発生しました");
    });

    daily.on("network-quality-change", (event) => {
      if (event?.threshold === "good") {
        setNetworkQuality("good");
      } else if (event?.threshold === "low") {
        setNetworkQuality("poor");
      }
    });

    // Join the call
    daily.join().catch((err) => {
      console.error("Failed to join:", err);
      setError("通話への参加に失敗しました");
      setIsJoining(false);
    });

    return () => {
      daily.destroy();
    };
  }, [roomUrl, token, onLeave]);

  const updateParticipantCount = (daily: DailyCall) => {
    const participants = daily.participants();
    setParticipantCount(Object.keys(participants).length);
  };

  const handleToggleMute = useCallback(() => {
    if (callObject) {
      callObject.setLocalAudio(!isMuted ? false : true);
      setIsMuted(!isMuted);
    }
  }, [callObject, isMuted]);

  const handleToggleVideo = useCallback(() => {
    if (callObject) {
      callObject.setLocalVideo(!isVideoOff ? false : true);
      setIsVideoOff(!isVideoOff);
    }
  }, [callObject, isVideoOff]);

  const handleToggleScreenShare = useCallback(async () => {
    if (callObject) {
      if (isScreenSharing) {
        callObject.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        try {
          await callObject.startScreenShare();
          setIsScreenSharing(true);
        } catch (err) {
          console.error("Screen share error:", err);
        }
      }
    }
  }, [callObject, isScreenSharing]);

  const handleLeave = useCallback(() => {
    if (callObject) {
      callObject.leave();
    }
  }, [callObject]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
        <Card className="bg-red-900/50 border-red-700">
          <CardContent className="p-6 text-center">
            <p className="text-red-200 mb-4">{error}</p>
            <Button variant="secondary" onClick={onLeave}>
              戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
        <p>通話に参加中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{participantCount}人</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                networkQuality === "good"
                  ? "bg-green-500"
                  : networkQuality === "poor"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
            />
            <span>
              {networkQuality === "good"
                ? "良好"
                : networkQuality === "poor"
                ? "不安定"
                : "接続中"}
            </span>
          </div>
        </div>
        <div className="text-gray-400">
          オンライン診療
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {/* Daily.co will render video here through the call object */}
        <DailyVideo callObject={callObject} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-800">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={handleToggleMute}
          title={isMuted ? "マイクをオン" : "マイクをオフ"}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={handleToggleVideo}
          title={isVideoOff ? "カメラをオン" : "カメラをオフ"}
        >
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={handleToggleScreenShare}
          title={isScreenSharing ? "画面共有を停止" : "画面を共有"}
        >
          {isScreenSharing ? (
            <MonitorOff className="h-6 w-6" />
          ) : (
            <Monitor className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={handleLeave}
          title="通話を終了"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

// Daily Video component to render participants
function DailyVideo({ callObject }: { callObject: DailyCall | null }) {
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && callObject) {
        // Get all participants
        const participants = callObject.participants();

        // Clear previous content
        node.innerHTML = "";

        const participantIds = Object.keys(participants);
        const count = participantIds.length;

        // Create grid layout based on participant count
        const gridCols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
        node.style.display = "grid";
        node.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
        node.style.gap = "4px";
        node.style.height = "100%";
        node.style.padding = "4px";

        participantIds.forEach((id) => {
          const participant = participants[id];
          const videoContainer = document.createElement("div");
          videoContainer.className = "relative bg-gray-800 rounded-lg overflow-hidden";
          videoContainer.style.minHeight = "200px";

          // Create video element for the participant
          const videoTrack = participant.tracks?.video;
          const audioTrack = participant.tracks?.audio;

          if (videoTrack?.track) {
            const videoEl = document.createElement("video");
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = id === "local"; // Mute local video to prevent echo
            videoEl.style.width = "100%";
            videoEl.style.height = "100%";
            videoEl.style.objectFit = "cover";

            const stream = new MediaStream([videoTrack.track]);
            videoEl.srcObject = stream;
            videoContainer.appendChild(videoEl);
          } else {
            // Show placeholder when no video
            const placeholder = document.createElement("div");
            placeholder.className =
              "w-full h-full flex items-center justify-center bg-gray-700";
            placeholder.innerHTML = `
              <div class="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                ${participant.user_name?.[0]?.toUpperCase() || "?"}
              </div>
            `;
            videoContainer.appendChild(placeholder);
          }

          // Add audio for remote participants
          if (audioTrack?.track && id !== "local") {
            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            const stream = new MediaStream([audioTrack.track]);
            audioEl.srcObject = stream;
            videoContainer.appendChild(audioEl);
          }

          // Add name label
          const nameLabel = document.createElement("div");
          nameLabel.className =
            "absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm";
          nameLabel.textContent =
            id === "local" ? "あなた" : participant.user_name || "参加者";
          videoContainer.appendChild(nameLabel);

          // Add muted indicator
          if (participant.audio === false) {
            const mutedIndicator = document.createElement("div");
            mutedIndicator.className =
              "absolute top-2 right-2 p-1 bg-red-500 rounded";
            mutedIndicator.innerHTML =
              '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>';
            videoContainer.appendChild(mutedIndicator);
          }

          node.appendChild(videoContainer);
        });
      }
    },
    [callObject]
  );

  // Re-render on participant changes
  useEffect(() => {
    if (!callObject) return;

    const handleParticipantUpdated = () => {
      // Force re-render by updating the container
      const container = document.getElementById("daily-video-container");
      if (container) {
        containerRef(container as HTMLDivElement);
      }
    };

    callObject.on("participant-updated", handleParticipantUpdated);
    callObject.on("track-started", handleParticipantUpdated);
    callObject.on("track-stopped", handleParticipantUpdated);

    return () => {
      callObject.off("participant-updated", handleParticipantUpdated);
      callObject.off("track-started", handleParticipantUpdated);
      callObject.off("track-stopped", handleParticipantUpdated);
    };
  }, [callObject, containerRef]);

  return (
    <div
      id="daily-video-container"
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
