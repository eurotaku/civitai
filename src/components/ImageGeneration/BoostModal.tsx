import { Button, Checkbox, Group, Modal, ModalProps, Paper, Stack, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconBolt, IconExclamationMark } from '@tabler/icons-react';
import { useState } from 'react';
import { AlertWithIcon } from '~/components/AlertWithIcon/AlertWithIcon';

export function BoostModal({ onClose, ...props }: Props) {
  const [checked, setChecked] = useState(false);
  const [, setShowBoostModal] = useLocalStorage({ key: 'show-boost-modal', defaultValue: true });

  const handleClose = () => {
    onClose();
    setChecked(false);
  };

  const handleSubmit = () => {
    if (checked) setShowBoostModal(false);
    handleClose();
  }

  return (
    <Modal
      {...props}
      onClose={handleClose}
      title={
        <Group>
          <IconBolt size={20} /> Boost
        </Group>
      }
    >
      <Stack>
        <AlertWithIcon icon={<IconExclamationMark />} size="sm">
          {`When there is too much demand or you've already generated a large quantity of images in a month, you may notice slower generation times. Boosting with Buzz, allows you to speed up the generation time of a single job when you don't want to wait.`}
        </AlertWithIcon>
        <Group position="center">
          <Stack align="center">
            <Paper p="sm" withBorder>
              <Group spacing={8}>
                <IconBolt size={24} />
                <Text size="md" inline>
                  10
                </Text>
              </Group>
            </Paper>
            <Checkbox label="Don't show me this again" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          </Stack>
        </Group>
        <Group spacing={8} align="flex-end" grow>
          <Button onClick={handleSubmit}>Boost it!</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

type Props = Omit<ModalProps, 'title' | 'children'>;