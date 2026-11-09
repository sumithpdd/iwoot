/**
 * Admin API helpers — always go through /api/admin/*.
 */

import { apiRequest } from "@/lib/api/http"

export type AdminUserRow = {
  id: string
  email: string
  displayName?: string
  createdAt: string
}

export class AdminService {
  static async listUsers(
    getToken: () => Promise<string | null>
  ): Promise<AdminUserRow[]> {
    return apiRequest<AdminUserRow[]>(getToken, "/api/admin/users")
  }
}
