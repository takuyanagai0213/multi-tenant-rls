import type { Workspace } from "@prisma/client";
import type { Site } from "@prisma/client";
import type { Tenant } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { Resolver } from "@quramy/prisma-fabbrica/lib/internal";
export { resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";
type BuildDataOptions<TTransients extends Record<string, unknown>> = {
    readonly seq: number;
} & TTransients;
type TraitName = string | symbol;
type CallbackDefineOptions<TCreated, TCreateInput, TTransients extends Record<string, unknown>> = {
    onAfterBuild?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onBeforeCreate?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onAfterCreate?: (created: TCreated, transientFields: TTransients) => void | PromiseLike<void>;
};
export declare const initialize: (options: import("@quramy/prisma-fabbrica/lib/internal").InitializeOptions) => void;
type WorkspaceFactoryDefineInput = {
    name?: string;
    slug?: string;
    tenant?: Tenant;
    createdAt?: Date;
    updatedAt?: Date;
    sites?: Prisma.SiteCreateNestedManyWithoutWorkspaceInput;
};
type WorkspaceTransientFields = Record<string, unknown> & Partial<Record<keyof WorkspaceFactoryDefineInput, never>>;
type WorkspaceFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<WorkspaceFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Workspace, Prisma.WorkspaceCreateInput, TTransients>;
type WorkspaceFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<WorkspaceFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: WorkspaceFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Workspace, Prisma.WorkspaceCreateInput, TTransients>;
type WorkspaceTraitKeys<TOptions extends WorkspaceFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface WorkspaceFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Workspace";
    build(inputData?: Partial<Prisma.WorkspaceCreateInput & TTransients>): PromiseLike<Prisma.WorkspaceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.WorkspaceCreateInput & TTransients>): PromiseLike<Prisma.WorkspaceCreateInput>;
    buildList(list: readonly Partial<Prisma.WorkspaceCreateInput & TTransients>[]): PromiseLike<Prisma.WorkspaceCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.WorkspaceCreateInput & TTransients>): PromiseLike<Prisma.WorkspaceCreateInput[]>;
    pickForConnect(inputData: Workspace): Pick<Workspace, "id">;
    create(inputData?: Partial<Prisma.WorkspaceCreateInput & TTransients>): PromiseLike<Workspace>;
    createList(list: readonly Partial<Prisma.WorkspaceCreateInput & TTransients>[]): PromiseLike<Workspace[]>;
    createList(count: number, item?: Partial<Prisma.WorkspaceCreateInput & TTransients>): PromiseLike<Workspace[]>;
    createForConnect(inputData?: Partial<Prisma.WorkspaceCreateInput & TTransients>): PromiseLike<Pick<Workspace, "id">>;
}
export interface WorkspaceFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends WorkspaceFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): WorkspaceFactoryInterfaceWithoutTraits<TTransients>;
}
interface WorkspaceFactoryBuilder {
    <TOptions extends WorkspaceFactoryDefineOptions>(options?: TOptions): WorkspaceFactoryInterface<{}, WorkspaceTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends WorkspaceTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends WorkspaceFactoryDefineOptions<TTransients>>(options?: TOptions) => WorkspaceFactoryInterface<TTransients, WorkspaceTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Workspace} model.
 *
 * @param options
 * @returns factory {@link WorkspaceFactoryInterface}
 */
export declare const defineWorkspaceFactory: WorkspaceFactoryBuilder;
type SiteworkspaceFactory = {
    _factoryFor: "Workspace";
    build: () => PromiseLike<Prisma.WorkspaceCreateNestedOneWithoutSitesInput["create"]>;
};
type SiteFactoryDefineInput = {
    name?: string;
    description?: string | null;
    tenant?: Tenant;
    createdAt?: Date;
    updatedAt?: Date;
    workspace: SiteworkspaceFactory | Prisma.WorkspaceCreateNestedOneWithoutSitesInput;
};
type SiteTransientFields = Record<string, unknown> & Partial<Record<keyof SiteFactoryDefineInput, never>>;
type SiteFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SiteFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Site, Prisma.SiteCreateInput, TTransients>;
type SiteFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<SiteFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: SiteFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Site, Prisma.SiteCreateInput, TTransients>;
type SiteTraitKeys<TOptions extends SiteFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SiteFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Site";
    build(inputData?: Partial<Prisma.SiteCreateInput & TTransients>): PromiseLike<Prisma.SiteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SiteCreateInput & TTransients>): PromiseLike<Prisma.SiteCreateInput>;
    buildList(list: readonly Partial<Prisma.SiteCreateInput & TTransients>[]): PromiseLike<Prisma.SiteCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SiteCreateInput & TTransients>): PromiseLike<Prisma.SiteCreateInput[]>;
    pickForConnect(inputData: Site): Pick<Site, "id">;
    create(inputData?: Partial<Prisma.SiteCreateInput & TTransients>): PromiseLike<Site>;
    createList(list: readonly Partial<Prisma.SiteCreateInput & TTransients>[]): PromiseLike<Site[]>;
    createList(count: number, item?: Partial<Prisma.SiteCreateInput & TTransients>): PromiseLike<Site[]>;
    createForConnect(inputData?: Partial<Prisma.SiteCreateInput & TTransients>): PromiseLike<Pick<Site, "id">>;
}
export interface SiteFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SiteFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SiteFactoryInterfaceWithoutTraits<TTransients>;
}
interface SiteFactoryBuilder {
    <TOptions extends SiteFactoryDefineOptions>(options: TOptions): SiteFactoryInterface<{}, SiteTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SiteTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SiteFactoryDefineOptions<TTransients>>(options: TOptions) => SiteFactoryInterface<TTransients, SiteTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Site} model.
 *
 * @param options
 * @returns factory {@link SiteFactoryInterface}
 */
export declare const defineSiteFactory: SiteFactoryBuilder;
//# sourceMappingURL=index.d.ts.map