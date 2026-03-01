"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { generateId } from "@/services/mock-service";
import {
  Plus,
  MessageSquare,
  Hash,
  Megaphone,
  ClipboardList,
  Send,
  Save,
  Paperclip,
  ChevronRight,
  ArrowLeft,
  MessagesSquare,
  CalendarClock,
  Settings,
  Link2,
  FileText,
  Calendar,
  BookOpen,
  Globe,
} from "lucide-react";
import type { Channel, PinnedContext } from "@/types/communication";
import type { Announcement, ThreadReply } from "@/types/communication";

export default function CommunicationPage() {
  const loading = useMockLoading();
  const channels = useStore((s) => s.channels);
  const announcements = useStore((s) => s.announcements);
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const assessments = useStore((s) => s.assessments);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const reportCycles = useStore((s) => s.reportCycles);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const addAnnouncement = useStore((s) => s.addAnnouncement);
  const updateAnnouncement = useStore((s) => s.updateAnnouncement);
  const activeClassId = useStore((s) => s.ui.activeClassId);

  // State
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Compose form state
  const [composeChannel, setComposeChannel] = useState("");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachmentType, setComposeAttachmentType] = useState("");
  const [composeAttachmentLabel, setComposeAttachmentLabel] = useState("");

  // C8: Audience selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [audienceAll, setAudienceAll] = useState(true);

  // C8: Scheduled send
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // C8: Notification settings (local UI state)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // D3: Translation preview
  const [translationPreview, setTranslationPreview] = useState(false);

  // C9: Pinned context for compose
  const [composePinnedType, setComposePinnedType] = useState<string>("");
  const [composePinnedRefId, setComposePinnedRefId] = useState<string>("");

  // Audience students for selected compose channel
  const composeChannelClassId = useMemo(() => {
    const ch = channels.find((c) => c.id === composeChannel);
    return ch?.classId || "";
  }, [channels, composeChannel]);

  const audienceStudents = useMemo(() => {
    if (!composeChannelClassId) return [];
    return getStudentsByClassId(composeChannelClassId);
  }, [composeChannelClassId, getStudentsByClassId]);

  // Available entities for "Link to..." in compose (C9)
  const availableAssessments = useMemo(() => {
    if (!composeChannelClassId) return assessments;
    return assessments.filter((a) => a.classId === composeChannelClassId);
  }, [assessments, composeChannelClassId]);

  const availableEvents = useMemo(() => {
    if (!composeChannelClassId) return calendarEvents;
    return calendarEvents.filter((e) => !e.classId || e.classId === composeChannelClassId);
  }, [calendarEvents, composeChannelClassId]);

  // Group channels by class
  const channelsByClass = useMemo(() => {
    const grouped: Record<string, { className: string; channels: Channel[] }> = {};
    channels.forEach((ch) => {
      if (!grouped[ch.classId]) {
        const cls = classes.find((c) => c.id === ch.classId);
        grouped[ch.classId] = {
          className: cls?.name || "Unknown class",
          channels: [],
        };
      }
      grouped[ch.classId].channels.push(ch);
    });
    return grouped;
  }, [channels, classes]);

  // Sync with global class switcher — auto-select first channel of active class
  useEffect(() => {
    if (activeClassId && channelsByClass[activeClassId]?.channels.length > 0) {
      setSelectedChannelId(channelsByClass[activeClassId].channels[0].id);
      setSelectedAnnouncementId(null);
    }
  }, [activeClassId, channelsByClass]);

  // Announcements for selected channel
  const channelAnnouncements = useMemo(() => {
    if (!selectedChannelId) return [];
    return announcements
      .filter((a) => a.channelId === selectedChannelId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [announcements, selectedChannelId]);

  // Selected announcement
  const selectedAnnouncement = useMemo(() => {
    if (!selectedAnnouncementId) return null;
    return announcements.find((a) => a.id === selectedAnnouncementId) || null;
  }, [announcements, selectedAnnouncementId]);

  // Selected channel
  const selectedChannel = useMemo(() => {
    if (!selectedChannelId) return null;
    return channels.find((c) => c.id === selectedChannelId) || null;
  }, [channels, selectedChannelId]);

  // Helpers
  const getClassName = useCallback(
    (classId: string) => {
      const cls = classes.find((c) => c.id === classId);
      return cls?.name || "Unknown";
    },
    [classes]
  );

  const getChannelIcon = (type: Channel["type"]) => {
    switch (type) {
      case "announcements": return Megaphone;
      case "assignments": return ClipboardList;
      default: return Hash;
    }
  };

  // Resolve pinned context label (C9)
  const resolvePinnedContextLink = useCallback(
    (ctx: PinnedContext): string => {
      switch (ctx.type) {
        case "assessment":
          return `/assessments`;
        case "event":
          return `/calendar`;
        case "report":
          return `/reports`;
        default:
          return "#";
      }
    },
    []
  );

  // Reset compose form
  const resetCompose = () => {
    setComposeChannel("");
    setComposeTitle("");
    setComposeBody("");
    setComposeAttachmentType("");
    setComposeAttachmentLabel("");
    setSelectedStudentIds([]);
    setAudienceAll(true);
    setScheduleEnabled(false);
    setScheduledDate("");
    setScheduledTime("");
    setComposePinnedType("");
    setComposePinnedRefId("");
  };

  // Send announcement
  const handleSendAnnouncement = (asDraft: boolean) => {
    if (!composeChannel || !composeTitle.trim() || !composeBody.trim()) {
      toast.error("Please fill in channel, title, and body");
      return;
    }
    const channel = channels.find((c) => c.id === composeChannel);
    if (!channel) {
      toast.error("Invalid channel selected");
      return;
    }
    const now = new Date().toISOString();
    const attachments = composeAttachmentType && composeAttachmentLabel.trim()
      ? [{
          id: generateId("attach"),
          type: composeAttachmentType as "assessment" | "event" | "report" | "file",
          referenceId: generateId("ref"),
          label: composeAttachmentLabel.trim(),
        }]
      : [];

    // Build pinned context (C9)
    let pinnedContext: PinnedContext | undefined;
    if (composePinnedType && composePinnedType !== "none" && composePinnedRefId) {
      const refLabel =
        composePinnedType === "assessment"
          ? assessments.find((a) => a.id === composePinnedRefId)?.title || composePinnedRefId
          : composePinnedType === "event"
          ? calendarEvents.find((e) => e.id === composePinnedRefId)?.title || composePinnedRefId
          : composePinnedType === "report"
          ? reportCycles.find((r) => r.id === composePinnedRefId)?.name || composePinnedRefId
          : composePinnedRefId;
      pinnedContext = {
        type: composePinnedType as PinnedContext["type"],
        referenceId: composePinnedRefId,
        label: refLabel,
      };
    }

    // Determine status based on scheduling
    const isScheduled = scheduleEnabled && scheduledDate && scheduledTime && !asDraft;
    const scheduledAt = isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined;

    const announcement: Announcement = {
      id: generateId("ann"),
      channelId: composeChannel,
      classId: channel.classId,
      title: composeTitle.trim(),
      body: composeBody.trim(),
      attachments,
      pinnedContext,
      status: asDraft ? "draft" : isScheduled ? "scheduled" : "sent",
      scheduledAt,
      sentAt: asDraft || isScheduled ? undefined : now,
      createdAt: now,
      threadReplies: [],
    };
    addAnnouncement(announcement);
    toast.success(asDraft ? "Saved as draft" : isScheduled ? `Scheduled for ${format(parseISO(scheduledAt!), "MMM d 'at' h:mm a")}` : "Announcement sent");
    resetCompose();
    setComposeOpen(false);

    // Auto-select the channel if not already selected
    if (!selectedChannelId) {
      setSelectedChannelId(composeChannel);
    }
  };

  // Send reply
  const handleSendReply = () => {
    if (!selectedAnnouncement || !replyText.trim()) return;
    const now = new Date().toISOString();
    const reply: ThreadReply = {
      id: generateId("reply"),
      authorName: "Ms. Mitchell",
      body: replyText.trim(),
      createdAt: now,
    };
    updateAnnouncement(selectedAnnouncement.id, {
      threadReplies: [...selectedAnnouncement.threadReplies, reply],
    });
    toast.success("Reply sent");
    setReplyText("");
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Communication" />
        <CardGridSkeleton count={4} />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title="Communication"
        description="Announcements, updates, and class channels"
        primaryAction={{
          label: "New announcement",
          onClick: () => setComposeOpen(true),
          icon: Plus,
        }}
      />

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="messages" className="text-[13px]">
            <MessagesSquare className="h-3.5 w-3.5 mr-1.5" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[13px]">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
      <div className="flex gap-0 border border-border rounded-xl overflow-hidden bg-background" style={{ height: "calc(100vh - 260px)", minHeight: 480 }}>
        {/* Left panel: Channel list */}
        <div className="w-[260px] shrink-0 border-r border-border bg-muted/30 overflow-y-auto">
          <div className="p-3 border-b border-border/50">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Channels</p>
          </div>
          {Object.entries(channelsByClass).length === 0 ? (
            <div className="p-4">
              <p className="text-[12px] text-muted-foreground">No channels available</p>
            </div>
          ) : (
            Object.entries(channelsByClass).map(([classId, group]) => (
              <div key={classId}>
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{group.className}</p>
                </div>
                {group.channels.map((ch) => {
                  const ChannelIcon = getChannelIcon(ch.type);
                  const isActive = selectedChannelId === ch.id;
                  const unreadCount = announcements.filter(
                    (a) => a.channelId === ch.id && a.status === "sent"
                  ).length;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setSelectedChannelId(ch.id);
                        setSelectedAnnouncementId(null);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "bg-[#fff2f0] text-[#c24e3f]"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <ChannelIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[13px] truncate flex-1">{ch.name}</span>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Right panel: Announcement feed or thread view */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedChannelId ? (
            /* No channel selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="rounded-2xl bg-muted p-4 inline-block mb-3">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-medium text-foreground mb-1">Select a channel</p>
                <p className="text-[13px] text-muted-foreground">Choose a channel from the left to view announcements</p>
              </div>
            </div>
          ) : selectedAnnouncementId && selectedAnnouncement ? (
            /* Thread view */
            <>
              <div className="p-3 border-b border-border/50 flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setSelectedAnnouncementId(null)}
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-[13px] text-muted-foreground truncate">
                  {selectedChannel?.name}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Pinned context chip (C9) */}
                {selectedAnnouncement.pinnedContext && (
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Linked to</span>
                    <Badge
                      variant="outline"
                      className="text-[11px] gap-1 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        const href = resolvePinnedContextLink(selectedAnnouncement.pinnedContext!);
                        window.location.href = href;
                      }}
                    >
                      {selectedAnnouncement.pinnedContext.type === "assessment" && <BookOpen className="h-3 w-3" />}
                      {selectedAnnouncement.pinnedContext.type === "event" && <Calendar className="h-3 w-3" />}
                      {selectedAnnouncement.pinnedContext.type === "report" && <FileText className="h-3 w-3" />}
                      {selectedAnnouncement.pinnedContext.label}
                    </Badge>
                  </div>
                )}

                {/* Scheduled indicator */}
                {selectedAnnouncement.status === "scheduled" && selectedAnnouncement.scheduledAt && (
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Scheduled for {format(parseISO(selectedAnnouncement.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                )}

                {/* Original announcement */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-[15px] font-semibold">{selectedAnnouncement.title}</h3>
                      <p className="text-[12px] text-muted-foreground">
                        {format(parseISO(selectedAnnouncement.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <StatusBadge status={selectedAnnouncement.status} showIcon={false} />
                  </div>
                  <p className="text-[13px] text-foreground whitespace-pre-wrap">{selectedAnnouncement.body}</p>
                  {selectedAnnouncement.attachments.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {selectedAnnouncement.attachments.map((att) => (
                        <Badge key={att.id} variant="outline" className="text-[11px] gap-1">
                          <Paperclip className="h-3 w-3" />
                          {att.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Thread replies */}
                <div>
                  <h4 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Replies ({selectedAnnouncement.threadReplies.length})
                  </h4>
                  {selectedAnnouncement.threadReplies.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground py-4">No replies yet. Start the conversation below.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedAnnouncement.threadReplies.map((reply) => (
                        <div key={reply.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] font-medium">{reply.authorName}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {format(parseISO(reply.createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-[13px] text-foreground">{reply.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reply input */}
              <div className="p-3 border-t border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="text-[13px] flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Announcement feed for selected channel */
            <>
              <div className="p-3 border-b border-border/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {selectedChannel && (() => {
                    const Icon = getChannelIcon(selectedChannel.type);
                    return <Icon className="h-4 w-4 text-[#c24e3f]" />;
                  })()}
                  <span className="text-[14px] font-semibold">{selectedChannel?.name}</span>
                  <Badge variant="outline" className="text-[11px]">{selectedChannel?.type}</Badge>
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {channelAnnouncements.length} announcement{channelAnnouncements.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {channelAnnouncements.length === 0 ? (
                  <EmptyState
                    icon={MessagesSquare}
                    title="No announcements"
                    description="This channel has no announcements yet. Create one to get started."
                    action={{
                      label: "New announcement",
                      onClick: () => {
                        setComposeChannel(selectedChannelId || "");
                        setComposeOpen(true);
                      },
                    }}
                  />
                ) : (
                  <div className="divide-y divide-border/50">
                    {channelAnnouncements.map((announcement) => (
                      <button
                        key={announcement.id}
                        onClick={() => setSelectedAnnouncementId(announcement.id)}
                        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="text-[13px] font-semibold text-foreground truncate flex-1">
                            {announcement.title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={announcement.status} showIcon={false} />
                          </div>
                        </div>
                        <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2">
                          {announcement.body}
                        </p>
                        {announcement.pinnedContext && (
                          <div className="flex items-center gap-1 mb-2">
                            <Link2 className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-[10px] h-5 gap-1">
                              {announcement.pinnedContext.label}
                            </Badge>
                          </div>
                        )}
                        {announcement.status === "scheduled" && announcement.scheduledAt && (
                          <div className="flex items-center gap-1 mb-2 text-[11px] text-muted-foreground">
                            <CalendarClock className="h-3 w-3" />
                            Scheduled: {format(parseISO(announcement.scheduledAt), "MMM d 'at' h:mm a")}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>
                            {format(parseISO(announcement.createdAt), "MMM d, yyyy")}
                          </span>
                          {announcement.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {announcement.attachments.length} attachment{announcement.attachments.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {announcement.threadReplies.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {announcement.threadReplies.length} repl{announcement.threadReplies.length !== 1 ? "ies" : "y"}
                            </span>
                          )}
                          <ChevronRight className="h-3 w-3 ml-auto" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6 max-w-md">
            <h3 className="text-[14px] font-semibold mb-4">Notification preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">Email notifications</p>
                  <p className="text-[12px] text-muted-foreground">Receive email for new announcements</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">In-app notifications</p>
                  <p className="text-[12px] text-muted-foreground">Show badge and toast for updates</p>
                </div>
                <Switch
                  checked={inAppNotifications}
                  onCheckedChange={setInAppNotifications}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compose announcement dialog */}
      <Dialog open={composeOpen} onOpenChange={(open) => { setComposeOpen(open); if (!open) resetCompose(); }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>Compose and send an announcement to a class channel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Channel *</Label>
              <Select value={composeChannel} onValueChange={setComposeChannel}>
                <SelectTrigger className="text-[13px]">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {getClassName(ch.classId)} - {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Audience selection (C8) */}
            {composeChannel && audienceStudents.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px]">Recipients</Label>
                  <button
                    type="button"
                    className="text-[12px] text-[#c24e3f] hover:underline"
                    onClick={() => {
                      if (audienceAll) {
                        setAudienceAll(false);
                        setSelectedStudentIds(audienceStudents.map((s) => s.id));
                      } else {
                        setAudienceAll(true);
                        setSelectedStudentIds([]);
                      }
                    }}
                  >
                    {audienceAll ? "Select specific students" : "Select all"}
                  </button>
                </div>
                {audienceAll ? (
                  <p className="text-[12px] text-muted-foreground">
                    All {audienceStudents.length} students in class
                  </p>
                ) : (
                  <div className="max-h-[120px] overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                    {audienceStudents.map((stu) => (
                      <label key={stu.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                        <Checkbox
                          checked={selectedStudentIds.includes(stu.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudentIds((prev) => [...prev, stu.id]);
                            } else {
                              setSelectedStudentIds((prev) => prev.filter((id) => id !== stu.id));
                            }
                          }}
                        />
                        <span className="text-[12px]">{stu.firstName} {stu.lastName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[13px]">Title *</Label>
              <Input
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                placeholder="Announcement title"
                className="text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Body *</Label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your announcement..."
                className="text-[13px] min-h-[120px]"
              />
            </div>

            {/* D3: Translation preview */}
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-medium">Translation preview</p>
                  <p className="text-[11px] text-muted-foreground">Preview how this announcement reads in Spanish</p>
                </div>
              </div>
              <Switch checked={translationPreview} onCheckedChange={setTranslationPreview} />
            </div>
            {translationPreview && composeBody.trim() && (
              <Card className="p-3 gap-0 bg-muted/40 border-dashed">
                <p className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Spanish (Preview)
                </p>
                <p className="text-[13px] text-foreground/80 italic">
                  {composeBody.trim().split("").reverse().join("") || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Note: This is a mock preview. AI-powered translation will be available in a future release.
                </p>
              </Card>
            )}

            <Separator />

            {/* Scheduled send (C8) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={scheduleEnabled}
                  onCheckedChange={(checked) => setScheduleEnabled(checked === true)}
                />
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-[13px] cursor-pointer" onClick={() => setScheduleEnabled(!scheduleEnabled)}>
                    Schedule for later
                  </Label>
                </div>
              </div>
              {scheduleEnabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <Label className="text-[12px] text-muted-foreground">Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[12px] text-muted-foreground">Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="text-[13px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Link to entity (C9) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                  Link to... (optional)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Type</Label>
                  <Select value={composePinnedType} onValueChange={(v) => { setComposePinnedType(v); setComposePinnedRefId(""); }}>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="report">Report cycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Entity</Label>
                  <Select value={composePinnedRefId} onValueChange={setComposePinnedRefId} disabled={!composePinnedType || composePinnedType === "none"}>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {composePinnedType === "assessment" && availableAssessments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                      {composePinnedType === "event" && availableEvents.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                      ))}
                      {composePinnedType === "report" && reportCycles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Attachment (optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Type</Label>
                  <Select value={composeAttachmentType} onValueChange={setComposeAttachmentType}>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Label</Label>
                  <Input
                    value={composeAttachmentLabel}
                    onChange={(e) => setComposeAttachmentLabel(e.target.value)}
                    placeholder="e.g. Unit 3 test"
                    className="text-[13px]"
                    disabled={!composeAttachmentType}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setComposeOpen(false); resetCompose(); }}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSendAnnouncement(true)}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save as draft
            </Button>
            <Button onClick={() => handleSendAnnouncement(false)}>
              {scheduleEnabled && scheduledDate && scheduledTime ? (
                <>
                  <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                  Schedule
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
