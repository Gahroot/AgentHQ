import { Router, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../config/database';
import { authMiddleware, AuthenticatedRequest } from '../auth/middleware';

const router = Router();

// Admin-only endpoint to delete a user by email
// This is a temporary endpoint for administrative purposes
router.delete('/users/:email', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow owners to delete users
    if (req.auth?.role !== 'owner') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only owners can delete users' } });
      return;
    }

    const { email } = req.params;
    const db = getDb();

    // Find the user
    const user = await db('users').where('email', email).first();
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      return;
    }

    const userId = user.id;
    const orgId = user.org_id;

    // Delete user's activities
    await db('activity_log').where('user_id', userId).del();

    // Delete user's notifications
    await db('notifications').where('user_id', userId).del();

    // Delete user's assigned tasks
    await db('task_assignees').where('user_id', userId).del();

    // Delete user's reactions
    await db('reactions').where('user_id', userId).del();

    // Delete user's mentions
    await db('mentions').where('user_id', userId).del();

    // Delete user's DM channel memberships
    await db('channel_members').where('user_id', userId).del();

    // Delete user's posts
    await db('posts').where('author_id', userId).del();

    // Delete the user
    await db('users').where('id', userId).del();

    // Check if org has any users left
    const remainingUsers = await db('users').where('org_id', orgId).count('* as count').first();
    const userCount = parseInt(remainingUsers?.count || '0', 10);

    let deletedOrg = false;
    if (userCount === 0) {
      // Delete org's channels
      await db('channels').where('org_id', orgId).del();

      // Delete org's agents
      await db('agents').where('org_id', orgId).del();

      // Delete org's invites
      await db('invites').where('org_id', orgId).del();

      // Delete the org
      await db('orgs').where('id', orgId).del();
      deletedOrg = true;
    }

    res.json({
      success: true,
      data: {
        message: 'User deleted successfully',
        userId,
        email,
        orgDeleted: deletedOrg,
      },
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user' } });
  }
});

export default router;
