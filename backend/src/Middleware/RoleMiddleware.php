<?php 

namespace App\middleware;

use App\Utils\Response;
use App\Utils\Logger;
use App\Exceptions\AuthenticationException;

class RoleMiddleware 
{
    /**
     * Role hierarchy (higher numbers have more permissions)
     */
    private static $roleHierarchy = [
        'student' => 1,
        'tutor' => 2,
        'admin' => 3,
        'super_admin' => 4
    ];

    /**
     * Permission mappings for roles
     */
    private static $rolePermissions = [
        'student' => [
            'view_profile',
            'edit_profile',
            'book_sessions',
            'view_sessions',
            'rate_tutors',
            'message_tutors'
        ],
        'tutor' => [
            'view_profile',
            'edit_profile',
            'view_sessions',
            'manage_sessions',
            'view_students',
            'message_students',
            'set_availability',
            'update_rates'
        ],
        'admin' => [
            'view_all_users',
            'manage_users',
            'view_all_sessions',
            'manage_sessions',
            'view_reports',
            'moderate_content'
        ],
        'super_admin' => [
            'full_access'
        ]
    ];

    /**
     * Require specific role for current request
     * 
     * @param array $user Current user data
     * @param string $requiredRole Required role
     * @return bool True if authorized
     */
    public static function requireRole(array $user, string $requiredRole): bool
    {
        try {
            if (!isset($user['role'])) {
                Logger::warning('User data missing role information', [
                    'user_id' => $user['user_id'] ?? 'unknown'
                ]);
                Response::forbidden('User role not found');
                return false;
            }

            $userRole = $user['role'];

            if (!self::hasRole($userRole, $requiredRole)) {
                Logger::warning('Access denied - insufficient role', [
                    'user_id' => $user['user_id'] ?? 'unknown',
                    'user_role' => $userRole,
                    'required_role' => $requiredRole,
                    'path' => $_SERVER['REQUEST_URI'] ?? 'unknown'
                ]);

                Response::forbidden("Access denied. Required role: $requiredRole");
                return false;
            }

            Logger::debug('Role authorization successful', [
                'user_id' => $user['user_id'],
                'user_role' => $userRole,
                'required_role' => $requiredRole
            ]);

            return true;

        } catch (\Exception $e) {
            Logger::error('Role middleware error', [
                'error' => $e->getMessage(),
                'required_role' => $requiredRole,
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);

            Response::serverError('Authorization service error');
            return false;
        }
    }

    /**
     * Check if user has any of the required roles
     * 
     * @param array $user Current user data
     * @param array $requiredRoles Array of acceptable roles
     * @return bool True if authorized
     */
    public static function requireAnyRole(array $user, array $requiredRoles): bool
    {
        try {
            if (!isset($user['role'])) {
                Logger::warning('User data missing role information', [
                    'user_id' => $user['user_id'] ?? 'unknown'
                ]);
                Response::forbidden('User role not found');
                return false;
            }

            $userRole = $user['role'];

            foreach ($requiredRoles as $role) {
                if (self::hasRole($userRole, $role)) {
                    Logger::debug('Role authorization successful (any role)', [
                        'user_id' => $user['user_id'],
                        'user_role' => $userRole,
                        'matched_role' => $role
                    ]);
                    return true;
                }
            }

            Logger::warning('Access denied - none of required roles match', [
                'user_id' => $user['user_id'] ?? 'unknown',
                'user_role' => $userRole,
                'required_roles' => $requiredRoles,
                'path' => $_SERVER['REQUEST_URI'] ?? 'unknown'
            ]);

            $rolesString = implode(', ', $requiredRoles);
            Response::forbidden("Access denied. Required roles: $rolesString");
            return false;

        } catch (\Exception $e) {
            Logger::error('Role middleware error (any role)', [
                'error' => $e->getMessage(),
                'required_roles' => $requiredRoles,
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);

            Response::serverError('Authorization service error');
            return false;
        }
    }

    /**
     * Check if user has specific permission
     * 
     * @param array $user Current user data
     * @param string $permission Required permission
     * @return bool True if authorized
     */
    public static function requirePermission(array $user, string $permission): bool
    {
        try {
            if (!isset($user['role'])) {
                Response::forbidden('User role not found');
                return false;
            }

            $userRole = $user['role'];

            if (!self::hasPermission($userRole, $permission)) {
                Logger::warning('Access denied - insufficient permissions', [
                    'user_id' => $user['user_id'] ?? 'unknown',
                    'user_role' => $userRole,
                    'required_permission' => $permission,
                    'path' => $_SERVER['REQUEST_URI'] ?? 'unknown'
                ]);

                Response::forbidden("Access denied. Required permission: $permission");
                return false;
            }

            Logger::debug('Permission authorization successful', [
                'user_id' => $user['user_id'],
                'user_role' => $userRole,
                'permission' => $permission
            ]);

            return true;

        } catch (\Exception $e) {
            Logger::error('Permission middleware error', [
                'error' => $e->getMessage(),
                'required_permission' => $permission,
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);

            Response::serverError('Authorization service error');
            return false;
        }
    }

    /**
     * Check if user can access their own resource or has admin privileges
     * 
     * @param array $user Current user data
     * @param int $resourceOwnerId ID of resource owner
     * @param array $adminRoles Roles that can access any resource
     * @return bool True if authorized
     */
    public static function requireOwnershipOrAdmin(
        array $user, 
        int $resourceOwnerId, 
        array $adminRoles = ['admin', 'super_admin']
    ): bool {
        $userId = $user['user_id'] ?? 0;
        $userRole = $user['role'] ?? '';

        // Check if user owns the resource
        if ($userId == $resourceOwnerId) {
            Logger::debug('Resource access granted - owner', [
                'user_id' => $userId,
                'resource_owner_id' => $resourceOwnerId
            ]);
            return true;
        }

        // Check if user has admin privileges
        if (in_array($userRole, $adminRoles)) {
            Logger::info('Resource access granted - admin privileges', [
                'user_id' => $userId,
                'user_role' => $userRole,
                'resource_owner_id' => $resourceOwnerId
            ]);
            return true;
        }

        Logger::warning('Access denied - not owner and no admin privileges', [
            'user_id' => $userId,
            'user_role' => $userRole,
            'resource_owner_id' => $resourceOwnerId
        ]);

        Response::forbidden('You can only access your own resources');
        return false;
    }

    /**
     * Check if user role has required role level or higher
     * 
     * @param string $userRole User's role
     * @param string $requiredRole Required role
     * @return bool True if user has required role or higher
     */
    public static function hasRole(string $userRole, string $requiredRole): bool
    {
        $userLevel = self::$roleHierarchy[$userRole] ?? 0;
        $requiredLevel = self::$roleHierarchy[$requiredRole] ?? 999;

        return $userLevel >= $requiredLevel;
    }

    /**
     * Check if user role has specific permission
     * 
     * @param string $userRole User's role
     * @param string $permission Required permission
     * @return bool True if role has permission
     */
    public static function hasPermission(string $userRole, string $permission): bool
    {
        // Super admin has full access
        if ($userRole === 'super_admin') {
            return true;
        }

        $rolePermissions = self::$rolePermissions[$userRole] ?? [];
        return in_array($permission, $rolePermissions);
    }

    /**
     * Get all permissions for a role
     * 
     * @param string $role Role name
     * @return array Array of permissions
     */
    public static function getRolePermissions(string $role): array
    {
        if ($role === 'super_admin') {
            // Return all possible permissions
            $allPermissions = [];
            foreach (self::$rolePermissions as $permissions) {
                $allPermissions = array_merge($allPermissions, $permissions);
            }
            return array_unique($allPermissions);
        }

        return self::$rolePermissions[$role] ?? [];
    }

    /**
     * Check if user can perform action on resource
     * 
     * @param array $user Current user data
     * @param string $action Action to perform
     * @param array $resource Resource data
     * @return bool True if authorized
     */
    public static function canPerformAction(array $user, string $action, array $resource): bool
    {
        $userRole = $user['role'] ?? '';
        $userId = $user['user_id'] ?? 0;

        // Define action-specific rules
        switch ($action) {
            case 'edit_profile':
                return $userId == ($resource['user_id'] ?? 0) || 
                       self::hasRole($userRole, 'admin');

            case 'delete_session':
                return ($userId == ($resource['student_id'] ?? 0) && $userRole === 'student') ||
                       ($userId == ($resource['tutor_id'] ?? 0) && $userRole === 'tutor') ||
                       self::hasRole($userRole, 'admin');

            case 'view_private_info':
                return $userId == ($resource['user_id'] ?? 0) || 
                       self::hasRole($userRole, 'admin');

            case 'moderate_content':
                return self::hasRole($userRole, 'admin');

            default:
                Logger::warning('Unknown action in role check', [
                    'action' => $action,
                    'user_id' => $userId
                ]);
                return false;
        }
    }

    /**
     * Middleware for student-only routes
     * 
     * @param array $user Current user data
     * @return bool True if authorized
     */
    public static function studentOnly(array $user): bool
    {
        return self::requireRole($user, 'student');
    }

    /**
     * Middleware for tutor-only routes
     * 
     * @param array $user Current user data
     * @return bool True if authorized
     */
    public static function tutorOnly(array $user): bool
    {
        return self::requireRole($user, 'tutor');
    }

    /**
     * Middleware for admin-only routes
     * 
     * @param array $user Current user data
     * @return bool True if authorized
     */
    public static function adminOnly(array $user): bool
    {
        return self::requireRole($user, 'admin');
    }

    /**
     * Middleware for verified tutors only
     * 
     * @param array $user Current user data
     * @return bool True if authorized
     */
    public static function verifiedTutorOnly(array $user): bool
    {
        if (!self::requireRole($user, 'tutor')) {
            return false;
        }

        if (empty($user['is_verified_tutor'])) {
            Logger::warning('Access denied - tutor not verified', [
                'user_id' => $user['user_id'] ?? 'unknown'
            ]);
            Response::forbidden('Only verified tutors can access this resource');
            return false;
        }

        return true;
    }

    /**
     * Add custom role to hierarchy
     * 
     * @param string $role Role name
     * @param int $level Role level
     */
    public static function addRole(string $role, int $level): void
    {
        self::$roleHierarchy[$role] = $level;
    }

    /**
     * Add permission to role
     * 
     * @param string $role Role name
     * @param string $permission Permission to add
     */
    public static function addPermissionToRole(string $role, string $permission): void
    {
        if (!isset(self::$rolePermissions[$role])) {
            self::$rolePermissions[$role] = [];
        }
        
        if (!in_array($permission, self::$rolePermissions[$role])) {
            self::$rolePermissions[$role][] = $permission;
        }
    }

    /**
     * Get user's role level
     * 
     * @param string $role Role name
     * @return int Role level
     */
    public static function getRoleLevel(string $role): int
    {
        return self::$roleHierarchy[$role] ?? 0;
    }
}

?>