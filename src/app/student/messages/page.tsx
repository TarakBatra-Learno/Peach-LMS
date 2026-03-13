"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useStudentId, useCurrentUser } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  getStudentChannels,
  getStudentAnnouncements,
  getStudentThreadReplies,
  getStudentClasses,
} from "@/lib/student-selectors";
import { generateId } from "@/services/mock-service";
import {
  MessageSquare,
  Send,
  Pin,
  Paperclip,
  User,
  Hash,
  Users,
  Mail,
  Plus,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Announcement, Channel, PinnedContext } from "@/types/communication";

export default function StudentMessagesPage() {
  const studentId = useStudentId();
  const currentUser = useCurrentUser();
  const loading = useMockLoading([studentId]);
  const state = useStore((s) => s);
  const addThreadReply = useStore((s) => s.addThreadReply);
  const addChannel = useStore((s) => s.addChannel);
  const addAnnouncement = useStore((s) => s.addAnnouncement);
  const student = state.students.find((s) => s.id === studentId);

  const channels = useMemo(
    () => (studentId ? getStudentChannels(state, studentId) : []),
    [state, studentId]
  );

  const classChannels = useMemo(
    () => channels.filter((ch) => ch.type === "general" || ch.type === "announcements" || ch.type === "assignments"),
    [channels]
  );
  const projectChannels = useMemo(
    () => channels.filter((ch) => ch.type === "project"),
    [channels]
  );
  const dmChannels = useMemo(
    () => channels.filter((ch) => ch.type === "dm"),
    [channels]
  );

  const searchParams = useSearchParams();
  const startDmClassId = searchParams.get("startDm");
  const channelParam = searchParams.get("channel");
  const [manualActiveChannelId, setManualActiveChannelId] = useState<string | null>(null);

  const enrolledClasses = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );
  const requestedDmClass = useMemo(
    () => enrolledClasses.find((entry) => entry.id === startDmClassId) ?? null,
    [enrolledClasses, startDmClassId]
  );
  const existingTeacherDm = useMemo(
    () =>
      studentId
        ? dmChannels.find(
            (channel) =>
              channel.participantIds?.includes("tchr_01") &&
              channel.participantIds?.includes(studentId)
          ) ?? null
        : null,
    [dmChannels, studentId]
  );
  const requestedChannelId = useMemo(
    () => (channelParam && channels.some((channel) => channel.id === channelParam) ? channelParam : null),
    [channelParam, channels]
  );

  // DM compose state
  const [showDmCompose, setShowDmCompose] = useState(false);

  const handleCreateDm = (teacherId: string, teacherName: string, classId: string) => {
    // Check if DM already exists
    const existing = dmChannels.find(
      (ch) => ch.participantIds?.includes(teacherId) && ch.participantIds?.includes(studentId!)
    );
    if (existing) {
      setManualActiveChannelId(existing.id);
      setShowDmCompose(false);
      return;
    }
    const channelId = generateId("ch");
    addChannel({
      id: channelId,
      classId,
      name: `DM: ${currentUser?.name ?? "Student"} ↔ ${teacherName}`,
      type: "dm",
      participantIds: [studentId!, teacherId],
      createdAt: new Date().toISOString(),
    });
    setManualActiveChannelId(channelId);
    setShowDmCompose(false);
    toast.success("New conversation started");
  };

  const defaultChannelId =
    requestedChannelId ??
    (requestedDmClass ? existingTeacherDm?.id ?? null : null) ??
    classChannels[0]?.id ??
    projectChannels[0]?.id ??
    dmChannels[0]?.id ??
    null;

  const activeChannelId =
    manualActiveChannelId && channels.some((channel) => channel.id === manualActiveChannelId)
      ? manualActiveChannelId
      : defaultChannelId;

  const activeChannel = channels.find((ch) => ch.id === activeChannelId) ?? null;

  const announcements = useMemo(
    () => (activeChannelId ? getStudentAnnouncements(state, activeChannelId) : []),
    [state, activeChannelId]
  );

  const shouldShowDmCompose =
    showDmCompose ||
    (!!requestedDmClass && !existingTeacherDm && !requestedChannelId && !manualActiveChannelId);

  const resolvePinnedContextHref = useCallback(
    (context: PinnedContext): string | null => {
      if (context.type === "assessment") {
        const assessment = state.assessments.find((entry) => entry.id === context.referenceId);
        return assessment
          ? `/student/classes/${assessment.classId}/assessments/${assessment.id}`
          : null;
      }

      if (context.type === "report") {
        const report = state.reports.find(
          (entry) =>
            entry.id === context.referenceId &&
            entry.studentId === studentId &&
            entry.distributionStatus === "completed"
        );
        return report ? `/student/progress/reports/${report.id}` : null;
      }

      if (context.type === "event") {
        return "/student/calendar";
      }

      return null;
    },
    [state.assessments, state.reports, studentId]
  );

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student to view messages."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Class channels, project groups, and direct messages"
      />

      <div className="flex gap-4 min-h-[500px]">
        {/* Sidebar */}
        <div className="w-[220px] shrink-0 space-y-4">
          {/* Class channels */}
          {classChannels.length > 0 && (
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Class channels
              </p>
              <div className="space-y-0.5">
                {classChannels.map((ch) => (
                  <button
                    key={ch.id}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      ch.id === activeChannelId
                        ? "bg-[#fff2f0] text-[#c24e3f] font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      setManualActiveChannelId(ch.id);
                      setShowDmCompose(false);
                    }}
                  >
                    # {ch.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project channels */}
          {projectChannels.length > 0 && (
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Projects
              </p>
              <div className="space-y-0.5">
                {projectChannels.map((ch) => (
                  <button
                    key={ch.id}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      ch.id === activeChannelId
                        ? "bg-[#fff2f0] text-[#c24e3f] font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      setManualActiveChannelId(ch.id);
                      setShowDmCompose(false);
                    }}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DM channels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Direct Messages
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] gap-0.5"
                onClick={() => setShowDmCompose(true)}
              >
                <Plus className="h-3 w-3" />
                New
              </Button>
            </div>
            <div className="space-y-0.5">
              {dmChannels.map((ch) => (
                <button
                  key={ch.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    ch.id === activeChannelId
                      ? "bg-[#fff2f0] text-[#c24e3f] font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => {
                    setManualActiveChannelId(ch.id);
                    setShowDmCompose(false);
                  }}
                >
                  <Mail className="h-3 w-3 inline mr-1" />
                  {ch.name.replace(/^DM:\s*/, "")}
                </button>
              ))}
              {dmChannels.length === 0 && (
                <button
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-[#c24e3f]/30 text-[12px] text-[#c24e3f] hover:bg-[#fff2f0] transition-colors"
                  onClick={() => setShowDmCompose(true)}
                >
                  Message your teacher
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {shouldShowDmCompose ? (
            <DmCompose
              enrolledClasses={enrolledClasses}
              preferredClassId={requestedDmClass?.id ?? null}
              onSelect={handleCreateDm}
              onCancel={() => setShowDmCompose(false)}
            />
          ) : activeChannel ? (
            <ChannelView
              channel={activeChannel}
              announcements={announcements}
              studentId={studentId}
              studentName={student ? `${student.firstName} ${student.lastName}` : "Student"}
              addThreadReply={addThreadReply}
              addAnnouncement={addAnnouncement}
              resolvePinnedContextHref={resolvePinnedContextHref}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-[14px] text-muted-foreground">
                  Select a channel to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DmCompose({
  enrolledClasses,
  preferredClassId,
  onSelect,
  onCancel,
}: {
  enrolledClasses: import("@/types/class").Class[];
  preferredClassId: string | null;
  onSelect: (teacherId: string, teacherName: string, classId: string) => void;
  onCancel: () => void;
}) {
  // For this prototype, teacher IDs are derived from the teacher persona
  // Each class has a teacher — we use "tchr_01" as the primary teacher
  const teacherOptions = useMemo(() => {
    const seen = new Set<string>();
    return enrolledClasses
      .map((cls) => ({
        teacherId: "tchr_01",
        teacherName: "Ms. Mitchell",
        classId: cls.id,
        className: cls.name,
      }))
      .filter((opt) => {
        if (seen.has(opt.teacherId + opt.classId)) return false;
        seen.add(opt.teacherId + opt.classId);
        return true;
      });
  }, [enrolledClasses]);

  const orderedTeacherOptions = useMemo(() => {
    if (!preferredClassId) return teacherOptions;
    return [...teacherOptions].sort((a, b) => {
      if (a.classId === preferredClassId) return -1;
      if (b.classId === preferredClassId) return 1;
      return a.className.localeCompare(b.className);
    });
  }, [preferredClassId, teacherOptions]);

  return (
    <Card className="p-6 gap-0">
      <h3 className="text-[16px] font-semibold mb-1">New Direct Message</h3>
      <p className="text-[13px] text-muted-foreground mb-4">
        Start a conversation with one of your teachers
      </p>
      {preferredClassId && (
        <div className="rounded-lg border border-[#c24e3f]/20 bg-[#fff2f0] px-3 py-2 mb-4">
          <p className="text-[12px] font-medium text-[#c24e3f]">
            Starting from class context
          </p>
          <p className="text-[12px] text-muted-foreground">
            Your teacher options are prioritized for this class.
          </p>
        </div>
      )}
      <div className="space-y-2">
        {orderedTeacherOptions.map((opt) => (
          <button
            key={`${opt.teacherId}-${opt.classId}`}
            className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted transition-colors"
            onClick={() => onSelect(opt.teacherId, opt.teacherName, opt.classId)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium">{opt.teacherName}</p>
                <p className="text-[12px] text-muted-foreground">{opt.className}</p>
              </div>
              {opt.classId === preferredClassId && (
                <Badge className="bg-[#fff2f0] text-[#c24e3f] border border-[#ffc1b7]">
                  Recommended
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 text-[12px]"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </Card>
  );
}

function ChannelView({
  channel,
  announcements,
  studentId,
  studentName,
  addThreadReply,
  addAnnouncement,
  resolvePinnedContextHref,
}: {
  channel: Channel;
  announcements: Announcement[];
  studentId: string;
  studentName: string;
  addThreadReply: (announcementId: string, reply: { id: string; authorName: string; authorId?: string; authorRole?: "teacher" | "student"; body: string; createdAt: string }) => void;
  addAnnouncement: (announcement: Announcement) => void;
  resolvePinnedContextHref: (context: PinnedContext) => string | null;
}) {
  const [replyStates, setReplyStates] = useState<Record<string, { open: boolean; text: string }>>({});
  const [newMessageText, setNewMessageText] = useState("");

  const isAnnouncementOnly = channel.type === "announcements";
  const isDm = channel.type === "dm";
  const isProject = channel.type === "project";

  const handleSendReply = (announcementId: string) => {
    const replyState = replyStates[announcementId];
    if (!replyState?.text.trim()) return;
    addThreadReply(announcementId, {
      id: generateId("reply"),
      authorName: studentName,
      authorId: studentId,
      authorRole: "student",
      body: replyState.text.trim(),
      createdAt: new Date().toISOString(),
    });
    setReplyStates((prev) => ({ ...prev, [announcementId]: { open: false, text: "" } }));
    toast.success("Reply sent");
  };

  const handleSendNewMessage = () => {
    if (!newMessageText.trim()) return;
    addAnnouncement({
      id: generateId("ann"),
      channelId: channel.id,
      classId: channel.classId,
      title: isDm ? "Message" : newMessageText.trim().slice(0, 50),
      body: newMessageText.trim(),
      attachments: [],
      status: "sent",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      threadReplies: [],
    });
    setNewMessageText("");
    toast.success("Message sent");
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[16px] font-semibold">
          {isDm ? channel.name.replace(/^DM:\s*/, "") : `#${channel.name}`}
        </h3>
        <Badge variant="outline" className="text-[11px] capitalize">
          {channel.type}
        </Badge>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">
            {isDm ? "Start the conversation by sending a message below." : "No messages in this channel yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((announcement) => {
              const projectedReplies = getStudentThreadReplies(announcement.threadReplies);
              const replyState = replyStates[announcement.id] ?? { open: false, text: "" };

              return (
                <Card key={announcement.id} className="p-4 gap-0">
                  <div className="flex items-start justify-between">
                    <div>
                      {!isDm && (
                        <p className="text-[14px] font-semibold">{announcement.title}</p>
                      )}
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

                  {announcement.pinnedContext && (
                    <div className="mt-3">
                      {(() => {
                        const href = resolvePinnedContextHref(announcement.pinnedContext);
                        const content = (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffc1b7] bg-[#fff2f0] px-2.5 py-1 text-[11px] text-[#c24e3f]">
                            <Pin className="h-3 w-3" />
                            {announcement.pinnedContext.label}
                          </span>
                        );

                        return href ? (
                          <Link href={href} className="hover:opacity-80">
                            {content}
                          </Link>
                        ) : (
                          content
                        );
                      })()}
                    </div>
                  )}

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

                  {/* Reply input */}
                  {!isAnnouncementOnly && (
                    <div className="mt-3">
                      {replyState.open ? (
                        <div className="space-y-2">
                          <Textarea
                            value={replyState.text}
                            onChange={(e) =>
                              setReplyStates((prev) => ({
                                ...prev,
                                [announcement.id]: { open: true, text: e.target.value },
                              }))
                            }
                            placeholder="Write a reply..."
                            className="text-[13px] min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-[12px]"
                              onClick={() => handleSendReply(announcement.id)}
                              disabled={!replyState.text.trim()}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[12px]"
                              onClick={() =>
                                setReplyStates((prev) => ({
                                  ...prev,
                                  [announcement.id]: { open: false, text: "" },
                                }))
                              }
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[12px] text-muted-foreground"
                          onClick={() =>
                            setReplyStates((prev) => ({
                              ...prev,
                              [announcement.id]: { open: true, text: "" },
                            }))
                          }
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      )}

      {/* New message input for DM and project channels */}
      {(isDm || isProject) && (
        <div className="mt-4 space-y-2">
          <Separator />
          <div className="flex gap-2 pt-2">
            <Textarea
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder={isDm ? "Write a message..." : "Post to project channel..."}
              className="text-[13px] min-h-[60px] flex-1"
            />
            <Button
              size="sm"
              className="h-10 self-end"
              onClick={handleSendNewMessage}
              disabled={!newMessageText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
