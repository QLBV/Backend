import NotificationSetting from "../models/NotificationSetting";

const DEFAULT_SETTINGS = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  inAppEnabled: true,
};

export const getNotificationSettingsService = async (userId: number) => {
  const existing = await NotificationSetting.findOne({ where: { userId } });
  if (existing) {
    return existing;
  }

  return NotificationSetting.create({
    userId,
    ...DEFAULT_SETTINGS,
  });
};

export const updateNotificationSettingsService = async (
  userId: number,
  updates: Partial<typeof DEFAULT_SETTINGS>
) => {
  const existing = await NotificationSetting.findOne({ where: { userId } });
  if (!existing) {
    return NotificationSetting.create({
      userId,
      ...DEFAULT_SETTINGS,
      ...updates,
    });
  }

  await existing.update(updates);
  return existing;
};
