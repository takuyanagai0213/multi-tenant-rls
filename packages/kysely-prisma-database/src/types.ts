import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const Tenant = {
    ACME_CORP: "ACME_CORP",
    GLOBEX_INC: "GLOBEX_INC",
    WAYNE_ENTERPRISES: "WAYNE_ENTERPRISES",
    STARK_INDUSTRIES: "STARK_INDUSTRIES"
} as const;
export type Tenant = (typeof Tenant)[keyof typeof Tenant];
export type Site = {
    id: Generated<number>;
    name: string;
    description: string | null;
    tenant: Generated<Tenant>;
    workspaceId: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type Workspace = {
    id: Generated<number>;
    name: string;
    slug: string;
    tenant: Generated<Tenant>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type DB = {
    Site: Site;
    Workspace: Workspace;
};
