import {
  Box,
  Button,
  Center,
  CloseButton,
  Divider,
  Group,
  HoverCard,
  Input,
  Loader,
  Paper,
  Popover,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import React, { useEffect } from 'react';

import { createContextModal } from '~/components/Modals/utils/createContextModal';
import { trpc } from '~/utils/trpc';
import {
  Form,
  InputInlineSocialLinkInput,
  InputProfileImageUpload,
  InputShowcaseItemsInput,
  InputSimpleImageUpload,
  InputSwitch,
  InputText,
  InputTextArea,
  useForm,
  InputProfileSectionsSettingsInput,
} from '~/libs/form';
import { userProfileUpdateSchema } from '~/server/schema/user-profile.schema';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { AlertWithIcon } from '~/components/AlertWithIcon/AlertWithIcon';
import { IconExclamationMark, IconInfoCircle } from '@tabler/icons-react';
import { constants } from '~/server/common/constants';
import { EdgeMedia } from '~/components/EdgeMedia/EdgeMedia';
import { CosmeticType, LinkType } from '@prisma/client';
import { ProfileSectionsSettingsInput } from '~/components/Profile/ProfileSectionsSettingsInput';
import { z } from 'zod';
import { showErrorNotification, showSuccessNotification } from '~/utils/notifications';

const { openModal, Modal } = createContextModal({
  name: 'userProfileEditModal',
  withCloseButton: false,
  size: 'xl',
  Element: ({ context }) => {
    const utils = trpc.useContext();
    const currentUser = useCurrentUser();
    const theme = useMantineTheme();
    const { mutate, isLoading: isUpdating } = trpc.userProfile.update.useMutation({
      onSuccess: () => {
        if (currentUser) {
          utils.userProfile.get.invalidate({ username: currentUser.username });
        }
        showSuccessNotification({ message: 'Profile updated successfully' });
        context.close();
      },
      onError: async (error) => {
        showErrorNotification({
          title: 'There was an error awarding the entry',
          error: new Error(error.message),
        });
      },
    });
    const { data: equippedCosmetics, isLoading: loadingCosmetics } =
      trpc.user.getCosmetics.useQuery({ equipped: true }, { enabled: !!currentUser });
    const { isLoading: loadingProfile, data: user } = trpc.userProfile.get.useQuery(
      {
        username: currentUser ? currentUser.username : '',
      },
      {
        enabled: !!currentUser?.username,
      }
    );

    const badges = user
      ? user.cosmetics
          .map((c) => c.cosmetic)
          .filter((c) => c.type === CosmeticType.Badge && !!c.data)
      : [];

    const form = useForm({
      schema: userProfileUpdateSchema,
      shouldUnregister: false,
    });

    const [badgeId] = form.watch(['badgeId']);

    useEffect(() => {
      if (user && user?.profile && equippedCosmetics) {
        const { badges } = equippedCosmetics;
        const [selectedBadge] = badges;

        form.reset({
          ...user.profile,
          // TODO: Fix typing at some point :grimacing:.
          coverImage: user.profile.coverImage as any,
          profileImage: user?.image,
          socialLinks: (user?.links ?? [])
            .filter((link) => link.type === LinkType.Social)
            .map((link) => ({
              id: link.id,
              url: link.url,
              type: link.type,
            })),
          sponsorshipLinks: (user?.links ?? [])
            .filter((link) => link.type === LinkType.Sponsorship)
            .map((link) => ({
              id: link.id,
              url: link.url,
              type: link.type,
            })),
          badgeId: selectedBadge?.id ?? null,
        });
      }
    }, [user?.profile, equippedCosmetics]);

    const handleClose = () => context.close();
    const handleSubmit = (data: z.infer<typeof userProfileUpdateSchema>) => {
      mutate(data);
    };

    const isLoading = loadingCosmetics || loadingProfile;

    if (!user && !isLoading) {
      return (
        <Stack>
          <AlertWithIcon icon={<IconExclamationMark />} color="red">
            Something went wrong. we could not fetch your user.
          </AlertWithIcon>

          <Center>
            <Button variant="default" onClick={handleClose}>
              Close
            </Button>
          </Center>
        </Stack>
      );
    }

    if (isLoading) {
      return (
        <Center>
          <Loader />
        </Center>
      );
    }

    return (
      <Form form={form} onSubmit={handleSubmit}>
        <Stack>
          <Group position="apart">
            <Text size={24} weight={590}>
              Edit Profile
            </Text>

            <Group>
              <Button radius="xl" size="md" loading={isLoading || isUpdating} type="submit">
                Save Changes
              </Button>
              <CloseButton
                size="md"
                radius="xl"
                variant="transparent"
                ml="auto"
                iconSize={20}
                loading={isLoading || isUpdating}
                onClick={(e) => {
                  context.close();
                }}
              />
            </Group>
          </Group>
          <Divider />
          <InputProfileImageUpload name="profileImage" label="Edit profile image" />
          <Divider />
          <InputSimpleImageUpload
            name="coverImage"
            label="Edit cover image"
            aspectRatio={constants.profile.coverImageAspectRatio}
            // Im aware ideally this should ideally be 450, but images will look better on a higher res here
            previewWidth={constants.profile.coverImageWidth}
          >
            <Text size="sm" color="dimmed">
              Suggested resolution: {constants.profile.coverImageWidth}px x{' '}
              {constants.profile.coverImageHeight}px
            </Text>
          </InputSimpleImageUpload>
          <Divider />
          <InputTextArea name="message" label="Message" maxLength={200} />
          <Divider />
          <InputTextArea name="bio" label="Bio" maxLength={400} />
          <Divider />
          <InputText name="location" label="Location" maxLength={400} />
          <Divider />
          <InputInlineSocialLinkInput
            name="socialLinks"
            label="Social Links"
            type={LinkType.Social}
          />
          <InputInlineSocialLinkInput
            name="sponsorshipLinks"
            label="Sponsorship Links"
            type={LinkType.Sponsorship}
          />
          <Divider />
          <Stack>
            <Group spacing={4}>
              <Input.Label>Featured Award</Input.Label>
              <Popover withArrow width={300} withinPortal position="top">
                <Popover.Target>
                  <Box
                    display="inline-block"
                    sx={{ lineHeight: 0.8, cursor: 'pointer', opacity: 0.5 }}
                  >
                    <IconInfoCircle size={16} />
                  </Box>
                </Popover.Target>
                <Popover.Dropdown>
                  <Text weight={500} size="sm">
                    Featured Award
                  </Text>
                  <Text size="sm">
                    Badges appear next your username and can even include special effects. You can
                    earn badges by being a subscriber or earning trophies on the site.
                  </Text>
                </Popover.Dropdown>
              </Popover>
            </Group>

            {badges.length > 0 ? (
              <Group spacing={8} noWrap>
                {badges.map((cosmetic) => {
                  const data = (cosmetic.data ?? {}) as { url?: string };
                  const url = (data.url ?? '') as string;
                  const isSelected = badgeId === cosmetic.id;

                  return (
                    <HoverCard
                      key={cosmetic.id}
                      position="top"
                      width="auto"
                      openDelay={300}
                      withArrow
                      withinPortal
                    >
                      <HoverCard.Target>
                        <Button
                          key={cosmetic.id}
                          p={4}
                          variant={isSelected ? 'light' : 'subtle'}
                          style={
                            isSelected
                              ? {
                                  border: '3px solid',
                                  borderColor: theme.colors.blue[theme.fn.primaryShade()],
                                }
                              : undefined
                          }
                          onClick={() => {
                            if (isSelected) {
                              form.setValue('badgeId', null, { shouldDirty: true });
                            } else {
                              form.setValue('badgeId', cosmetic.id, { shouldDirty: true });
                            }
                          }}
                          sx={{ height: 64, width: 64 }}
                        >
                          <EdgeMedia src={url} width={64} />
                        </Button>
                      </HoverCard.Target>
                      <HoverCard.Dropdown>
                        <Stack spacing={0}>
                          <Text size="sm" weight={500}>
                            {cosmetic.name}
                          </Text>
                        </Stack>
                      </HoverCard.Dropdown>
                    </HoverCard>
                  );
                })}
              </Group>
            ) : (
              <Paper>
                <Center sx={{ width: '100%', height: 72 }}>
                  <Text size="sm" color="dimmed">
                    Your not earned any awards yet.
                  </Text>
                </Center>
              </Paper>
            )}
          </Stack>
          <Divider />
          {user?.username && (
            <InputShowcaseItemsInput
              label="Showcase"
              username={user.username}
              description="Select up to 5 models or images that you're most proud of."
              name="showcaseItems"
            />
          )}
          <Divider />
          {user?.profile && (
            <InputProfileSectionsSettingsInput
              name="profileSectionsSettings"
              label="Customize profile page"
              description="Drag diferent sections on your profile in order of your preference"
            />
          )}
        </Stack>
      </Form>
    );
  },
});

export const openUserProfileEditModal = openModal;
export default Modal;
