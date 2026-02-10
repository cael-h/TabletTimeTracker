import type { FC } from 'react';
import { LogOut, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useTransactions } from '../hooks/useTransactions';
import { useFamily } from '../hooks/useFamily';
import { useIdentity } from '../contexts/IdentityContext';
import { useTheme } from '../contexts/ThemeContext';
import type { TransactionUnit } from '../types';
import { IdentitySection } from '../components/settings/IdentitySection';
import { ProfileSection } from '../components/settings/ProfileSection';
import { ParentApprovalSection } from '../components/settings/ParentApprovalSection';
import { FamilySection } from '../components/settings/FamilySection';
import { ThemeSection } from '../components/settings/ThemeSection';
import { ReasonsSection } from '../components/settings/ReasonsSection';
import { MemberColorsSection } from '../components/settings/MemberColorsSection';
import { BalanceResetSection } from '../components/settings/BalanceResetSection';

export const SettingsPage: FC = () => {
  const { signOut, user } = useAuth();
  const { settings, addRewardReason, removeRewardReason, addRedemptionReason, removeRedemptionReason, addChoreReason, removeChoreReason } = useSettings();
  const { addTransaction, getBalance } = useTransactions();
  const { family, shareInvite, addManualMember, isApprovedParent, updateDisplayName, updateMemberColor, getCurrentMember, requestPermission } = useFamily();
  const { identity, setIdentity } = useIdentity();
  const { theme, setTheme } = useTheme();

  const currentMember = getCurrentMember();

  const handleResetBalance = async (childId: string, memberBalance: number, unit: TransactionUnit) => {
    if (!identity || !user) return;
    await addTransaction({
      amount: -memberBalance,
      reason: 'Balance Reset',
      category: 'Adjustment',
      user: identity,
      userId: user.uid,
      childId,
      unit,
    });
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <IdentitySection identity={identity || ''} onSetIdentity={setIdentity} />

      {family && currentMember && (
        <ProfileSection
          member={currentMember}
          onUpdateDisplayName={(name) => updateDisplayName(user!.uid, name)}
        />
      )}

      {currentMember?.role === 'parent' && currentMember?.status === 'pending' && (
        <ParentApprovalSection member={currentMember} onRequestPermission={requestPermission} />
      )}

      {family && user && (
        <FamilySection
          family={family}
          currentUserId={user.uid}
          isParent={isApprovedParent()}
          onShareInvite={shareInvite}
          onAddMember={addManualMember}
        />
      )}

      <ThemeSection theme={theme} onSetTheme={setTheme} />

      {settings && (
        <>
          <ReasonsSection
            title="Reward Reasons"
            icon={TrendingUp}
            iconClassName="text-green-600"
            reasons={settings.rewardReasons}
            onAdd={addRewardReason}
            onRemove={removeRewardReason}
          />
          <ReasonsSection
            title="Redemption Reasons"
            icon={TrendingDown}
            iconClassName="text-red-600"
            reasons={settings.redemptionReasons}
            onAdd={addRedemptionReason}
            onRemove={removeRedemptionReason}
          />
          <ReasonsSection
            title="Chore Reasons"
            icon={Briefcase}
            iconClassName="text-blue-600"
            reasons={settings.choreReasons}
            onAdd={addChoreReason}
            onRemove={removeChoreReason}
          />
        </>
      )}

      {family && (
        <>
          <MemberColorsSection
            members={Object.values(family.members)}
            onUpdateColor={updateMemberColor}
          />
          <BalanceResetSection
            members={Object.values(family.members)}
            getBalance={getBalance}
            onResetBalance={handleResetBalance}
          />
        </>
      )}

      {/* Sign Out */}
      <div className="card">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Tablet Time Tracker v1.0</p>
        <p className="mt-1">Made with ❤️ for families</p>
      </div>
    </div>
  );
};
