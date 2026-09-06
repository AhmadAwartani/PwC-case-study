import { env } from "./env";

/**
 * Hand-written OpenAPI 3.0 document (rather than JSDoc-comment generation)
 * so the whole spec is easy to review in one place. Documents every
 * endpoint that is actually implemented in Phase 1. Phase 2 should extend
 * `paths` and `components.schemas` below with the ticket/category/user
 * endpoints as they're implemented -- the structure is already set up to
 * make that additive.
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Support Helpdesk Ticketing System API",
    version: "1.0.0-phase2",
    description:
      "REST API for the helpdesk ticketing system. Covers authentication, session " +
      "handling, RBAC, and the full tickets/categories/users REST API including " +
      "server-side pagination, filtering, sorting, and search on the ticket list.",
  },
  servers: [{ url: `http://localhost:${env.port}`, description: "Local development" }],
  tags: [
    { name: "Health", description: "Service health check" },
    { name: "Auth", description: "Authentication and session management" },
    { name: "Tickets", description: "Ticket CRUD, comments, and the filterable/paginated queue" },
    { name: "Categories", description: "Ticket categories" },
    { name: "Users", description: "Admin user management" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description:
          "HTTP-only signed session cookie set by POST /api/auth/login. Not readable " +
          "or settable from client-side JavaScript.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["user", "moderator", "admin"] },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "email", "role", "isActive", "createdAt"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", format: "password", example: "Admin123!" },
        },
        required: ["email", "password"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/User" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Invalid request data." },
              details: { type: "object", nullable: true },
            },
            required: ["code", "message"],
          },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "IT – Hardware" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "createdAt"],
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          subject: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          categoryId: { type: "string", format: "uuid" },
          requesterId: { type: "string", format: "uuid" },
          assigneeId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "subject",
          "description",
          "status",
          "priority",
          "categoryId",
          "requesterId",
          "createdAt",
          "updatedAt",
        ],
      },
      TicketComment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          ticketId: { type: "string", format: "uuid" },
          authorId: { type: "string", format: "uuid" },
          body: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "ticketId", "authorId", "body", "createdAt"],
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalItems: { type: "integer", example: 187 },
          totalPages: { type: "integer", example: 10 },
        },
        required: ["page", "limit", "totalItems", "totalPages"],
      },
      PaginatedTicketsResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
        required: ["data", "pagination"],
      },
      PaginatedUsersResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/User" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
        required: ["data", "pagination"],
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Does not require authentication.",
        responses: {
          "200": {
            description: "Service is up.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        description:
          "Validates credentials, and on success sets an HTTP-only signed session " +
          "cookie and returns the authenticated user's safe public fields. Never " +
          "returns passwordHash.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Login succeeded. Sets the `session` cookie.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          "400": {
            description: "Validation error (missing/malformed email or password).",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          "401": {
            description:
              "Invalid credentials, or the account exists but is deactivated.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        description: "Clears the session cookie. Always succeeds.",
        responses: {
          "200": {
            description: "Logout succeeded.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: { success: { type: "boolean", example: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current authenticated user",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Currently authenticated user.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          "401": {
            description: "Not authenticated.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
        },
      },
    },
    "/api/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "List tickets (paginated, filtered, sorted)",
        description:
          "A 'user' role only ever sees tickets where they are the requester, " +
          "regardless of filters. 'moderator' and 'admin' see all tickets and can " +
          "filter freely. All filtering/sorting/pagination is executed server-side.",
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          {
            name: "status",
            in: "query",
            description: "Comma-separated: open,in_progress,resolved,closed",
            schema: { type: "string" },
          },
          {
            name: "priority",
            in: "query",
            description: "Comma-separated: low,medium,high,urgent",
            schema: { type: "string" },
          },
          {
            name: "category",
            in: "query",
            description: "Comma-separated category id(s)",
            schema: { type: "string" },
          },
          {
            name: "assignee",
            in: "query",
            description: "'me', 'unassigned', or a specific userId",
            schema: { type: "string" },
          },
          {
            name: "search",
            in: "query",
            description: "Case-insensitive match against subject OR description",
            schema: { type: "string" },
          },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string", enum: ["createdAt", "priority"], default: "createdAt" },
          },
          {
            name: "sortDir",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        ],
        responses: {
          "200": {
            description: "Paginated ticket list.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedTicketsResponse" },
              },
            },
          },
          "400": {
            description: "Invalid query parameters.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
            },
          },
          "401": { description: "Not authenticated." },
        },
      },
      post: {
        tags: ["Tickets"],
        summary: "Create a ticket",
        description: "Any authenticated user. requesterId is always the authenticated user.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  description: { type: "string" },
                  categoryId: { type: "string", format: "uuid" },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    default: "medium",
                  },
                },
                required: ["subject", "description", "categoryId"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Ticket created.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Ticket" } },
                },
              },
            },
          },
          "400": { description: "Validation error, or categoryId does not exist." },
          "401": { description: "Not authenticated." },
        },
      },
    },
    "/api/tickets/{id}": {
      get: {
        tags: ["Tickets"],
        summary: "Get ticket detail (including comments)",
        description: "The ticket's requester, or any moderator/admin, may view it.",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Ticket with its comments, oldest first." },
          "403": { description: "Authenticated as a 'user' who is not this ticket's requester." },
          "404": { description: "Ticket not found." },
        },
      },
      patch: {
        tags: ["Tickets"],
        summary: "Update ticket status/priority/assignee/category",
        description: "Moderator/admin only. A 'user' gets 403, even for their own ticket.",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["open", "in_progress", "resolved", "closed"],
                  },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  assigneeId: { type: "string", format: "uuid", nullable: true },
                  categoryId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated ticket." },
          "400": { description: "Validation error, or invalid assignee/category id." },
          "403": { description: "Caller is not a moderator/admin." },
          "404": { description: "Ticket not found." },
        },
      },
      delete: {
        tags: ["Tickets"],
        summary: "Soft-delete (close) a ticket",
        description:
          "Admin only. Implemented as a status change to 'closed' rather than a hard " +
          "delete -- see the Phase 2 report for the rationale.",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Ticket closed." },
          "403": { description: "Caller is not an admin." },
          "404": { description: "Ticket not found." },
        },
      },
    },
    "/api/tickets/{id}/comments": {
      post: {
        tags: ["Tickets"],
        summary: "Add a comment to a ticket",
        description: "The ticket's requester, or any moderator/admin, may comment.",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { body: { type: "string" } },
                required: ["body"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Comment created.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/TicketComment" } },
                },
              },
            },
          },
          "403": { description: "Caller is neither the requester nor a moderator/admin." },
          "404": { description: "Ticket not found." },
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories",
        description: "Any authenticated user.",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "All categories.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create a category",
        description: "Admin only. Duplicate names return 409, not 500.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" } },
                required: ["name"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Category created." },
          "403": { description: "Caller is not an admin." },
          "409": { description: "A category with this name already exists." },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        description: "Admin only. Optional ?role= filter, paginated.",
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "role", in: "query", schema: { type: "string", enum: ["user", "moderator", "admin"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Paginated user list. Never includes passwordHash.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedUsersResponse" },
              },
            },
          },
          "403": { description: "Caller is not an admin." },
        },
      },
    },
    "/api/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Change a user's role or active status",
        description:
          "Admin only. An admin cannot deactivate their own account (returns 400).",
        security: [{ sessionCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["user", "moderator", "admin"] },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated user." },
          "400": { description: "Validation error, or self-deactivation attempt." },
          "403": { description: "Caller is not an admin." },
          "404": { description: "User not found." },
        },
      },
    },
  },
};
