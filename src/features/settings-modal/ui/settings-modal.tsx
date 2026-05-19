import type { ReactNode } from "react";
import { settingsSections, type SettingsSectionId } from "@/features/settings-modal/model";
import { SettingsModalContent } from "@/features/settings-modal/ui/settings-modal-content";
import { SettingsModalSidebar } from "@/features/settings-modal/ui/settings-modal-sidebar";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Tabs } from "@/shared/ui/tabs";

type Props = {
  open: boolean;
  onClose: () => void;
  sectionContent?: Partial<Record<SettingsSectionId, ReactNode>>;
};

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsModal({ open, onClose, sectionContent }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        withPortal={false}
        overlayClassName="absolute inset-0 z-20 rounded-[inherit] bg-background/60 backdrop-blur-sm"
        className="absolute inset-x-6 top-1/2 z-30 flex h-[min(36rem,calc(100%-3rem))] w-[calc(100%-3rem)] max-w-5xl -translate-y-1/2 translate-x-0 flex-col gap-0 overflow-hidden rounded-md border border-[color:var(--input)] bg-card p-0"
      >
        <DialogHeader className="flex-row items-start items-center justify-between gap-3 border-b border-border px-5 py-2 text-left">
          <DialogTitle className="mb-0">Settings</DialogTitle>

          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Close">
              <CloseGlyph />
            </Button>
          </DialogClose>
        </DialogHeader>

        <Tabs
          defaultValue={settingsSections[0].id}
          orientation="vertical"
          className="flex min-h-0 flex-1 flex-row"
        >
          <SettingsModalSidebar sections={settingsSections} />
          <SettingsModalContent sections={settingsSections} sectionContent={sectionContent} />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
