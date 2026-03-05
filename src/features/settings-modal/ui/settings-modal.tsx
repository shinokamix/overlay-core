import { settingsSections } from "@/features/settings-modal/model";
import { SettingsModalContent } from "@/features/settings-modal/ui/settings-modal-content";
import { SettingsModalSidebar } from "@/features/settings-modal/ui/settings-modal-sidebar";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Tabs } from "@/shared/ui/tabs";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: Props) {
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
        className="absolute inset-x-6 top-1/2 z-30 flex h-[min(36rem,calc(100%-3rem))] w-[calc(100%-3rem)] max-w-5xl -translate-y-1/2 translate-x-0 flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-border/70 px-5 py-3 text-left">
          <div>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Configure overlay behavior and integrations.</DialogDescription>
          </div>

          <DialogClose asChild>
            <Button type="button" size="sm" variant="ghost">
              Close
            </Button>
          </DialogClose>
        </DialogHeader>

        <Tabs
          defaultValue={settingsSections[0].id}
          orientation="vertical"
          className="flex min-h-0 flex-1 flex-row"
        >
          <SettingsModalSidebar sections={settingsSections} />
          <SettingsModalContent sections={settingsSections} />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
