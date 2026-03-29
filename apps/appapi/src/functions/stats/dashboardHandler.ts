import { Hono } from 'hono';
import { requireRole } from '../../middleware/authRole';
import { Bindings, Variables } from '../../index';

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─────────────────────────────────────────────
// GET /stats/talent-dashboard
// Statistik untuk talent yang login
// ─────────────────────────────────────────────
router.get('/talent-dashboard', requireRole(['talent']), async (c) => {
  const userId = c.get('userId');

  const [projectCount, applicationCount, upcomingSchedules, estimatedFee] = await Promise.allSettled([
    c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as total FROM bookings WHERE talent_id = ? AND status IN (\'confirmed\', \'active\')'
    ).bind(userId).first<{ total: number }>(),

    c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as total FROM applications WHERE talent_id = ? AND status = \'pending\''
    ).bind(userId).first<{ total: number }>(),

    c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as total FROM schedules WHERE talent_id = ? AND schedule_date >= date(\'now\') AND schedule_date <= date(\'now\', \'+30 days\')'
    ).bind(userId).first<{ total: number }>(),

    c.env.DB_CORE.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE talent_id = ? AND type = \'payout\' AND status = \'pending\''
    ).bind(userId).first<{ total: number }>(),
  ]);

  return c.json({
    status: 'ok',
    data: {
      active_projects: projectCount.status === 'fulfilled' ? (projectCount.value?.total ?? 0) : 0,
      pending_applications: applicationCount.status === 'fulfilled' ? (applicationCount.value?.total ?? 0) : 0,
      upcoming_schedules: upcomingSchedules.status === 'fulfilled' ? (upcomingSchedules.value?.total ?? 0) : 0,
      estimated_pending_fee: estimatedFee.status === 'fulfilled' ? (estimatedFee.value?.total ?? 0) : 0,
    },
  });
});

// ─────────────────────────────────────────────
// GET /stats/client-dashboard
// Statistik untuk client yang login
// ─────────────────────────────────────────────
router.get('/client-dashboard', requireRole(['client']), async (c) => {
  const userId = c.get('userId');

  const [projectStats, applicationCount, activeContracts] = await Promise.allSettled([
    c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = \'casting\' THEN 1 ELSE 0 END) as casting_count, SUM(CASE WHEN status = \'production\' THEN 1 ELSE 0 END) as production_count FROM projects WHERE client_id = ? AND status NOT IN (\'cancelled\', \'draft\')'
    ).bind(userId).first<{ total: number; casting_count: number; production_count: number }>(),

    c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as total FROM applications WHERE project_id IN (SELECT id FROM projects WHERE client_id = ?) AND status = \'pending\''
    ).bind(userId).first<{ total: number }>(),

    c.env.DB_CORE.prepare(
      'SELECT COUNT(*) as total FROM contracts WHERE client_id = ? AND status = \'active\''
    ).bind(userId).first<{ total: number }>(),
  ]);

  const stats = projectStats.status === 'fulfilled' ? projectStats.value : null;

  return c.json({
    status: 'ok',
    data: {
      total_projects: stats?.total ?? 0,
      projects_in_casting: stats?.casting_count ?? 0,
      projects_in_production: stats?.production_count ?? 0,
      pending_applications: applicationCount.status === 'fulfilled' ? (applicationCount.value?.total ?? 0) : 0,
      active_contracts: activeContracts.status === 'fulfilled' ? (activeContracts.value?.total ?? 0) : 0,
    },
  });
});

// ─────────────────────────────────────────────
// GET /stats/admin-dashboard
// Statistik god mode untuk admin
// ─────────────────────────────────────────────
router.get('/admin-dashboard', requireRole(['admin', 'superadmin']), async (c) => {
  const [
    totalUsers, totalTalents, totalClients,
    activeProjects, totalRevenue, pendingPayouts,
    openDisputes, kycPending, newUsersToday, revenueThisMonth
  ] = await Promise.allSettled([
    c.env.DB_SSO.prepare('SELECT COUNT(*) as total FROM users').first<{ total: number }>(),
    c.env.DB_SSO.prepare('SELECT COUNT(*) as total FROM users WHERE role = \'talent\'').first<{ total: number }>(),
    c.env.DB_SSO.prepare('SELECT COUNT(*) as total FROM users WHERE role = \'client\'').first<{ total: number }>(),

    c.env.DB_CORE.prepare('SELECT COUNT(*) as total FROM projects WHERE status IN (\'casting\', \'production\')').first<{ total: number }>(),
    c.env.DB_CORE.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE type = \'fee\' AND status = \'completed\'').first<{ total: number }>(),
    c.env.DB_CORE.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE type = \'payout\' AND status = \'pending\'').first<{ total: number }>(),

    c.env.DB_CORE.prepare('SELECT COUNT(*) as total FROM disputes WHERE status = \'open\'').first<{ total: number }>(),
    c.env.DB_CORE.prepare('SELECT COUNT(*) as total FROM kyc_submissions WHERE status = \'pending\'').first<{ total: number }>(),
    c.env.DB_SSO.prepare('SELECT COUNT(*) as total FROM users WHERE created_at >= date(\'now\')').first<{ total: number }>(),
    c.env.DB_CORE.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE type = \'fee\' AND status = \'completed\' AND created_at >= date(\'now\', \'start of month\')').first<{ total: number }>(),
  ]);

  const g = (r: PromiseSettledResult<{ total: number } | null>) =>
    r.status === 'fulfilled' ? (r.value?.total ?? 0) : 0;

  return c.json({
    status: 'ok',
    data: {
      total_users: g(totalUsers),
      total_talents: g(totalTalents),
      total_clients: g(totalClients),
      active_projects: g(activeProjects),
      total_revenue: g(totalRevenue),
      pending_payouts: g(pendingPayouts),
      open_disputes: g(openDisputes),
      kyc_pending: g(kycPending),
      new_users_today: g(newUsersToday),
      revenue_this_month: g(revenueThisMonth),
    },
  });
});

export default router;
