"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { Separator } from "@/components/ui/separator";
import {
  getStudentChannels,
  getStudentAnnouncements,
  getStudentThreadReplies,
} from "@/lib/student-selectors";
import { generateId } from "@/services/mock-service";
import { MessageSquare, Send, Pin, Paperclip, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Announcement, Channel } from "@/types/communication";

interface ClassCommunicationTabProps {
  classId: string;
  studentId: string;
}

export function ClassCommunicationTab({ classId, studentId }: ClassCommunicationTabProps) {
  const state = useStore((s) => s);
  const addThreadReply = useStore((s) => s.addThreadReply);
  const student = state.students.find((s) => s.id === studentId);

  const channels = useMemo(
    () => getStudentChannels(state, studentId).filter((ch) => ch.classId === classId),
    [state, studentId, classId]
  );

  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    () => channels.find((ch) => ch.type === "announcements")?.id ?? channels[0]?.id ?? null
  );

  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  const announcements = useMemo(
    () => (activeChannelId ? getStudentAnnouncements(state, activeChannelId) : []),
    [state, activeChannelId]
  );

  if (channels.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No channels yet"
        description="Communication channels for this class will appear here."
      />
    );
  }

  return (
    <div className="flex gap-4 min-h-[400px]">
      {/* Channel list sidebar */}
      <div className="w-[200px] shrink-0">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Channels
        </p>
        <div className="space-y-0.5">
          {channels.map((ch) => (
            <button
              key={ch.id}
              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                ch.id === activeChannelId
                  ? "bg-[#fff2f0] text-[#c24e3f] font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setActiveChannelId(ch.id)}
            >
              # {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Channel content */}
      <div className="flex-1 min-w-0">
        {activeChannel && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-[16px] font-semibold">#{activeChannel.name}</h3>
              <Badge variant="outline" className="text-[11px] capitalize">
                {activeChannel.type}
              </Badge>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-[13px] text-muted-foreground">
                  No messages in this channel yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      studentId={studentId}
                      studentName={student ? `${student.firstName} ${student.lastName}` : "Student"}
                      isAnnouncementOnly={activeChannel.type === "announcements"}
                      addThreadReply={addThreadReply}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({
  announcement,
  studentId,
  studentName,
  isAnnouncementOnly,
  addThreadReply,
}: {
  announcement: Announcement;
  studentId: string;
  studentName: string;
  isAnnouncementOnly: boolean;
  addThreadReply: (announcementId: string, reply: { id: string; authorName: string; authorId?: string; authorRole?: "teacher" | "student"; body: string; createdAt: string }) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const projectedReplies = getStudentThreadReplies(announcement.threadReplies);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    addThreadReply(announcement.id, {
      id: generateId("reply"),
      authorName: studentName,
      authorId: studentId,
      authorRole: "student",
      body: replyText.trim(),
      createdAt: new Date().toISOString(),
    });
    setReplyText("");
    setReplyOpen(false);
    toast.success("Reply sent");
  };

  return (
    <Card className="p-4 gap-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[14px] font-semibold">{announcement.title}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {announcement.sentAt
              ? format(new Date(announcement.sentAt), "MMM d, yyyy 'at' h:mm a")
              : format(new Date(announcement.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        {announcement.pinnedContext && (
          <Pin className="h-3.5 w-3.5 text-[#c24e3f] shrink-0" />
        )}
      </div>

      <p className="text-[13px] text-muted-foreground mt-2 whitespace-pre-wrap">
        {announcement.body}
      </p>

      {/* Attachments */}
      {announcement.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {announcement.attachments.map((att) => (
            <Badge key={att.id} variant="outline" className="text-[11px] gap-1">
              <Paperclip className="h-3 w-3" />
              {att.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Thread replies */}
      {projectedReplies.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="space-y-2">
            {projectedReplies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium">{reply.authorName}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        reply.authorRole === "teacher"
                          ? "bg-[#dbeafe] text-[#2563eb]"
                          : "bg-[#dcfce7] text-[#16a34a]"
                      }`}
                    >
                      {reply.authorRole === "teacher" ? "Teacher" : "Student"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(reply.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reply input (not on announcement-only channels) */}
      {!isAnnouncementOnly && (
        <div className="mt-3">
          {replyOpen ? (
            <div className="space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="text-[13px] min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[12px]" onClick={handleSendReply} disabled={!replyText.trim()}>
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => { setReplyOpen(false); setReplyText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px] text-muted-foreground"
              onClick={() => setReplyOpen(true)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
