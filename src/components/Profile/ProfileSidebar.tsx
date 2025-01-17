import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { IconMapPin, IconPencilMinus, IconRss } from '@tabler/icons-react';

import { RankBadge } from '~/components/Leaderboard/RankBadge';
import { ContentClamp } from '~/components/ContentClamp/ContentClamp';
import { sortDomainLinks } from '~/utils/domain-link';
import { DomainIcon } from '~/components/DomainIcon/DomainIcon';
import { FollowUserButton } from '~/components/FollowUserButton/FollowUserButton';
import { UserStats } from '~/components/Profile/UserStats';
import { TipBuzzButton } from '~/components/Buzz/TipBuzzButton';
import { EdgeMedia } from '~/components/EdgeMedia/EdgeMedia';
import { formatDate } from '~/utils/date-helpers';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { trpc } from '~/utils/trpc';
import React, { useMemo, useState } from 'react';
import { UserAvatar } from '~/components/UserAvatar/UserAvatar';
import { openUserProfileEditModal } from '~/components/Modals/UserProfileEditModal';
import { CosmeticType } from '@prisma/client';

export function ProfileSidebar({ username, className }: { username: string; className?: string }) {
  const currentUser = useCurrentUser();
  const { data: user } = trpc.userProfile.get.useQuery({
    username,
  });
  const isCurrentUser = currentUser?.id === user?.id;
  const theme = useMantineTheme();
  const [showAllBadges, setShowAllBadges] = useState<boolean>(false);

  const badges = useMemo(
    () =>
      !user
        ? []
        : user.cosmetics
            .map((c) => c.cosmetic)
            .filter((c) => c.type === CosmeticType.Badge && !!c.data),
    [user]
  );

  if (!user) {
    return null;
  }

  const { profile, stats } = user;
  const shouldDisplayStats = stats && !!Object.values(stats).find((stat) => stat !== 0);

  return (
    <Stack className={className}>
      <UserAvatar user={user} size="xl" radius="md" />
      <RankBadge rank={user.rank} size="lg" withTitle />
      <Stack spacing={0}>
        <Text weight={700} size={24} color={theme.colorScheme === 'dark' ? 'white' : 'black'}>
          {user.username}
        </Text>
        {profile.location && (
          <Group spacing="sm">
            <Text color="dimmed">{profile.location}</Text>
            <IconMapPin size={16} />
          </Group>
        )}
      </Stack>
      {profile?.bio && <ContentClamp maxHeight={48}>{profile.bio}</ContentClamp>}
      <Group spacing={4}>
        {sortDomainLinks(user.links).map((link, index) => (
          <ActionIcon
            key={index}
            component="a"
            href={link.url}
            target="_blank"
            rel="nofollow noreferrer"
            size={24}
          >
            <DomainIcon domain={link.domain} size={24} />
          </ActionIcon>
        ))}
      </Group>
      <Group grow>
        {isCurrentUser && (
          <Button
            leftIcon={<IconPencilMinus size={16} />}
            size="md"
            onClick={() => {
              openUserProfileEditModal({});
            }}
            sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}
            radius="xl"
            fullWidth
          >
            Edit profile
          </Button>
        )}
        {!isCurrentUser && (
          <FollowUserButton
            userId={user.id}
            leftIcon={<IconRss size={16} />}
            size="md"
            sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}
          />
        )}
      </Group>

      <Divider my="sm" />

      {shouldDisplayStats && (
        <UserStats
          rating={{ value: stats.ratingAllTime, count: stats.ratingCountAllTime }}
          followers={stats.followerCountAllTime}
          favorites={stats.favoriteCountAllTime}
          downloads={stats.downloadCountAllTime}
        />
      )}
      <TipBuzzButton
        toUserId={user.id}
        size="md"
        variant="light"
        color="yellow.7"
        label="Tip buzz"
        sx={{ fontSize: '14px', fontWeight: 590 }}
      />

      {(!isCurrentUser || shouldDisplayStats) && <Divider my="sm" />}

      {badges.length > 0 && (
        <Stack>
          <Text size="md" color="dimmed" weight={590}>
            Badges
          </Text>
          <Group spacing="xs">
            {(showAllBadges ? badges : badges.slice(0, 4)).map((award) => {
              const data = (award.data ?? {}) as { url?: string };
              const url = (data.url ?? '') as string;

              if (!url) {
                return null;
              }

              return (
                <Tooltip key={award.id} label={award.name} withinPortal>
                  <EdgeMedia src={url} width={56} />
                </Tooltip>
              );
            })}
            {badges.length > 4 && (
              <Button
                color="gray"
                variant="light"
                onClick={() => setShowAllBadges((prev) => !prev)}
                size="xs"
                sx={{ fontSize: 12, fontWeight: 600 }}
                fullWidth
              >
                {showAllBadges ? 'Show less' : `Show all (${badges.length})`}
              </Button>
            )}
          </Group>
          <Divider my="sm" />
        </Stack>
      )}

      <Text color="dimmed">Joined {formatDate(user.createdAt)}</Text>
    </Stack>
  );
}
