"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useState } from "react";

interface VideoRoomProps {
  roomUrl: string;
  token: string | null;
  onLeave: () => void;
}

export function VideoRoom({ roomUrl, token, onLeave }: VideoRoomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    // Daily.co can be embedded via iframe when no API key is configured
    // When API key is available, we can use the Daily.co React SDK for more control
  }, [roomUrl, token]);

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // In a full implementation, this would communicate with the Daily.co iframe/SDK
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // In a full implementation, this would communicate with the Daily.co iframe/SDK
  };

  // Construct the iframe URL with token if available
  const iframeSrc = token ? `${roomUrl}?t=${token}` : roomUrl;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Video Area */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-800">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={handleToggleMute}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={handleToggleVideo}
        >
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={onLeave}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
