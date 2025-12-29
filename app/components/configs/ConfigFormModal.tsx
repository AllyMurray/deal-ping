import { Modal } from "@mantine/core";
import { ConfigForm, type ConfigFormValues } from "./ConfigForm";

export interface ConfigFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: ConfigFormValues) => void;
  initialValues?: Partial<ConfigFormValues>;
  isSubmitting?: boolean;
  isEditing?: boolean;
  channelId?: string;
}

export function ConfigFormModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  isSubmitting,
  isEditing,
  channelId,
}: ConfigFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? "Edit Search Term" : "Add Search Term"}
      centered
      size="md"
      data-testid="config-form-modal"
    >
      <ConfigForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Save Changes" : "Add Search Term"}
        isEditing={isEditing}
        channelId={channelId}
      />
    </Modal>
  );
}
