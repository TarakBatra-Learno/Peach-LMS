"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import {
  getEffectiveParentStudentId,
  getFamilyAnnouncements,
  getFamilyMessagesForThread,
  getFamilyThreads,
  getParentChildren,
  getParentProfile,
} from "@/lib/family-selectors";
import { generateId } from "@/services/mock-service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { TranslatedCopy } from "@/components/family/translated-copy";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBar } from "@/components/shared/filter-bar";
import { Bell, MessageSquare, Send, Users, VolumeX, Volume2 } from "lucide-react";

const VALID_TABS = new Set(["direct", "channels", "announcements"]);

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FamilyMessagesPage() {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const addFamilyMessage = useStore((store) => store.addFamilyMessage);
  const markFamilyThreadRead = useStore((store) => store.markFamilyThreadRead);
  const toggleFamilyThreadMute = useStore((store) => store.toggleFamilyThreadMute);
  const markFamilyAnnouncementRead = useStore((store) => store.markFamilyAnnouncementRead);
  const markAllFamilyAnnouncementsRead = useStore((store) => store.markAllFamilyAnnouncementsRead);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.has(initialTab) ? initialTab : "direct"
  );
  const [threadId, setThreadId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementReadFilter, setAnnouncementReadFilter] = useState("all");
  const loading = useMockLoading([parentId]);

  if (loading) return <DetailSkeleton />;

  if (!parentId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Not signed in"
        description="Choose a family persona from the entry page to review messages and announcements."
      />
    );
  }

  const parent = getParentProfile(state, parentId);
  const children = getParentChildren(state, parentId);
  const activeStudentId = getEffectiveParentStudentId(state, parentId);
  const directThreads = parent?.directMessagingEnabled ? getFamilyThreads(state, parentId, "direct", activeStudentId) : [];
  const channelThreads = getFamilyThreads(state, parentId, "channel", activeStudentId);
  const announcements = getFamilyAnnouncements(state, parentId, activeStudentId).filter((announcement) => {
    const matchesRead =
      announcementReadFilter === "all" ||
      (announcementReadFilter === "unread" && !announcement.readByParentIds.includes(parentId)) ||
      (announcementReadFilter === "read" && announcement.readByParentIds.includes(parentId));
    if (!matchesRead) return false;
    if (!announcementSearch) return true;
    const query = announcementSearch.toLowerCase();
    return announcement.title.toLowerCase().includes(query) || announcement.body.toLowerCase().includes(query);
  });

  if (!parent || children.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No linked children yet"
        description="Messages and announcements will appear here once your family account is linked."
      />
    );
  }

  const directMessagesByThread = new Map(
    directThreads.map((thread) => [thread.id, getFamilyMessagesForThread(state, thread.id)])
  );
  const channelMessagesByThread = new Map(
    channelThreads.map((thread) => [thread.id, getFamilyMessagesForThread(state, thread.id)])
  );
  const visibleThreads = activeTab === "channels" ? channelThreads : directThreads;
  const selectedThread = visibleThreads.find((thread) => thread.id === threadId) ?? visibleThreads[0] ?? null;
  const selectedMessages = selectedThread ? getFamilyMessagesForThread(state, selectedThread.id) : [];

  const handleSend = () => {
    if (!selectedThread || !replyDraft.trim()) return;
    addFamilyMessage({
      id: generateId("fam_msg"),
      threadId: selectedThread.id,
      authorId: parentId,
      authorName: parent.name,
      authorRole: "parent",
      body: replyDraft.trim(),
      attachments: [],
      createdAt: new Date().toISOString(),
      readByParentIds: [parentId],
    });
    setReplyDraft("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Announcements, family-enabled channels, and direct messages in one calm communication hub."
      >
        <div className="mt-2 flex flex-wrap gap-2">
          {activeStudentId ? (
            <Badge variant="outline">
              {children.find((child) => child.id === activeStudentId)?.firstName}
            </Badge>
          ) : (
            <Badge variant="outline">All children</Badge>
          )}
          <Badge variant="secondary">{announcements.filter((announcement) => !announcement.readByParentIds.includes(parentId)).length} unread announcements</Badge>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="direct">1:1 messages</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          {!parent.directMessagingEnabled ? (
            <EmptyState
              icon={MessageSquare}
              title="Direct messaging is not enabled"
              description="Your school is currently using announcements and channels for family communication."
            />
          ) : (
            <MessageWorkspace
              threads={directThreads}
              selectedThread={selectedThread}
              selectedMessages={selectedMessages}
              messagesByThread={directMessagesByThread}
              parentId={parentId}
              autoTranslate={parent.autoTranslateCommunications}
              onSelectThread={(nextThreadId) => {
                setThreadId(nextThreadId);
                markFamilyThreadRead(nextThreadId, parentId);
              }}
              onToggleMute={(nextThreadId) => toggleFamilyThreadMute(nextThreadId, parentId)}
              replyDraft={replyDraft}
              onReplyDraftChange={setReplyDraft}
              onSend={handleSend}
            />
          )}
        </TabsContent>

        <TabsContent value="channels">
          <MessageWorkspace
            threads={channelThreads}
            selectedThread={selectedThread}
            selectedMessages={selectedMessages}
            messagesByThread={channelMessagesByThread}
            parentId={parentId}
            autoTranslate={parent.autoTranslateCommunications}
            onSelectThread={(nextThreadId) => {
              setThreadId(nextThreadId);
              markFamilyThreadRead(nextThreadId, parentId);
            }}
            onToggleMute={(nextThreadId) => toggleFamilyThreadMute(nextThreadId, parentId)}
            replyDraft={replyDraft}
            onReplyDraftChange={setReplyDraft}
            onSend={handleSend}
          />
        </TabsContent>

        <TabsContent value="announcements">
          <FilterBar
            filters={[
              {
                key: "read",
                label: "Read state",
                options: [
                  { value: "all", label: "All announcements" },
                  { value: "unread", label: "Unread" },
                  { value: "read", label: "Read" },
                ],
                value: announcementReadFilter,
                onChange: setAnnouncementReadFilter,
              },
            ]}
            onSearch={setAnnouncementSearch}
            searchPlaceholder="Search announcements..."
          >
            <Button variant="outline" size="sm" onClick={() => markAllFamilyAnnouncementsRead(parentId)}>
              Mark all as read
            </Button>
          </FilterBar>

          {announcements.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No announcements to show"
              description="Try changing the filter or check back after the next school update."
            />
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card
                  key={announcement.id}
                  className="gap-0 p-5"
                  onClick={() => markFamilyAnnouncementRead(announcement.id, parentId)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-medium">{announcement.title}</h2>
                        {!announcement.readByParentIds.includes(parentId) && (
                          <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                        )}
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {announcement.audience === "school" ? "School-wide" : state.classes.find((entry) => entry.id === announcement.classId)?.name} · {formatTime(announcement.sentAt)}
                      </p>
                    </div>
                    {announcement.urgent && (
                      <Badge variant="outline" className="text-[10px] text-[#c24e3f]">
                        Important
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <TranslatedCopy
                      body={announcement.body}
                      translatedBody={announcement.translatedBody}
                      translatedLanguage={announcement.translatedLanguage}
                      autoTranslate={parent.autoTranslateCommunications}
                    />
                  </div>
                  {announcement.attachments.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {announcement.attachments.map((attachment) => (
                        <Badge key={attachment.id} variant="secondary" className="text-[10px]">
                          {attachment.label}
                        </Badge>
                      ))}
                      {announcement.emailMirrored && (
                        <Badge variant="outline" className="text-[10px]">
                          Mirrored by email
                        </Badge>
                      )}
                    </div>
                  )}
                  {announcement.attachments.length === 0 && announcement.emailMirrored && (
                    <div className="mt-4">
                      <Badge variant="outline" className="text-[10px]">
                        Mirrored by email
                      </Badge>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MessageWorkspace({
  threads,
  selectedThread,
  selectedMessages,
  messagesByThread,
  parentId,
  autoTranslate,
  onSelectThread,
  onToggleMute,
  replyDraft,
  onReplyDraftChange,
  onSend,
}: {
  threads: ReturnType<typeof getFamilyThreads>;
  selectedThread: ReturnType<typeof getFamilyThreads>[number] | null;
  selectedMessages: ReturnType<typeof getFamilyMessagesForThread>;
  messagesByThread: Map<string, ReturnType<typeof getFamilyMessagesForThread>>;
  parentId: string;
  autoTranslate: boolean;
  onSelectThread: (threadId: string) => void;
  onToggleMute: (threadId: string) => void;
  replyDraft: string;
  onReplyDraftChange: (value: string) => void;
  onSend: () => void;
}) {
  if (threads.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nothing here yet"
        description="New family-enabled conversations will appear here when teachers or the school start them."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="gap-0 p-3">
        <div className="space-y-1">
          {threads.map((thread) => {
            const unreadCount = (messagesByThread.get(thread.id) ?? []).filter(
              (message) => !message.readByParentIds.includes(parentId) && message.authorRole !== "parent"
            ).length;
            return (
              <button
                key={thread.id}
                className={`w-full rounded-[14px] px-3 py-3 text-left transition-colors ${
                  selectedThread?.id === thread.id ? "bg-[#fff2f0] text-[#c24e3f]" : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectThread(thread.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium">{thread.title}</p>
                  {unreadCount > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                {thread.subtitle && (
                  <p className="mt-1 text-[11px] text-muted-foreground">{thread.subtitle}</p>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedThread ? (
        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-[15px] font-medium">{selectedThread.title}</h2>
              {selectedThread.subtitle && (
                <p className="mt-1 text-[12px] text-muted-foreground">{selectedThread.subtitle}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={() => onToggleMute(selectedThread.id)}>
              {selectedThread.mutedByParentIds.includes(parentId) ? (
                <>
                  <Volume2 className="mr-1.5 h-4 w-4" />
                  Unmute
                </>
              ) : (
                <>
                  <VolumeX className="mr-1.5 h-4 w-4" />
                  Mute
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4 px-5 py-4">
            {selectedMessages.map((message) => (
              <div key={message.id} className={`max-w-[85%] rounded-[16px] border px-4 py-3 ${
                message.authorRole === "parent"
                  ? "ml-auto border-[#c24e3f]/20 bg-[#fff2f0]"
                  : "border-border bg-background"
              }`}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium">{message.authorName}</p>
                  <span className="text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
                </div>
                <TranslatedCopy
                  body={message.body}
                  translatedBody={message.translatedBody}
                  translatedLanguage={message.translatedLanguage}
                  autoTranslate={autoTranslate}
                />
                {message.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <Badge key={attachment.id} variant="secondary" className="text-[10px]">
                        {attachment.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t px-5 py-4">
            <Textarea
              value={replyDraft}
              onChange={(event) => onReplyDraftChange(event.target.value)}
              placeholder="Write a calm, family-safe reply..."
              className="min-h-[92px]"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={onSend} disabled={!replyDraft.trim()}>
                <Send className="mr-1.5 h-4 w-4" />
                Send reply
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
