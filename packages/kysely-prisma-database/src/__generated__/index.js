import { createInitializer, createScreener, getScalarFieldValueGenerator, normalizeResolver, normalizeList, getSequenceCounter, createCallbackChain, destructure } from "@quramy/prisma-fabbrica/lib/internal";
export { resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";
const initializer = createInitializer();
const { getClient } = initializer;
export const { initialize } = initializer;
const modelFieldDefinitions = [{
        name: "Workspace",
        fields: [{
                name: "sites",
                type: "Site",
                relationName: "SiteToWorkspace"
            }]
    }, {
        name: "Site",
        fields: [{
                name: "workspace",
                type: "Workspace",
                relationName: "SiteToWorkspace"
            }]
    }];
function autoGenerateWorkspaceScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Workspace", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "Workspace", fieldName: "slug", isId: false, isUnique: true, seq })
    };
}
function defineWorkspaceFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Workspace", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateWorkspaceScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver ?? {});
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {};
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().workspace.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Workspace",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link Workspace} model.
 *
 * @param options
 * @returns factory {@link WorkspaceFactoryInterface}
 */
export const defineWorkspaceFactory = ((options) => {
    return defineWorkspaceFactoryInternal(options ?? {}, {});
});
defineWorkspaceFactory.withTransientFields = defaultTransientFieldValues => options => defineWorkspaceFactoryInternal(options ?? {}, defaultTransientFieldValues);
function isSiteworkspaceFactory(x) {
    return x?._factoryFor === "Workspace";
}
function autoGenerateSiteScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Site", fieldName: "name", isId: false, isUnique: false, seq })
    };
}
function defineSiteFactoryInternal({ defaultData: defaultDataResolver, onAfterBuild, onBeforeCreate, onAfterCreate, traits: traitsDefs = {} }, defaultTransientFieldValues) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Site", modelFieldDefinitions);
        const handleAfterBuild = createCallbackChain([
            onAfterBuild,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterBuild),
        ]);
        const handleBeforeCreate = createCallbackChain([
            ...traitKeys.slice().reverse().map(traitKey => traitsDefs[traitKey]?.onBeforeCreate),
            onBeforeCreate,
        ]);
        const handleAfterCreate = createCallbackChain([
            onAfterCreate,
            ...traitKeys.map(traitKey => traitsDefs[traitKey]?.onAfterCreate),
        ]);
        const build = async (inputData = {}) => {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSiteScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver);
            const [transientFields, filteredInputData] = destructure(defaultTransientFieldValues, inputData);
            const resolverInput = { seq, ...transientFields };
            const defaultData = await traitKeys.reduce(async (queue, traitKey) => {
                const acc = await queue;
                const resolveTraitValue = normalizeResolver(traitsDefs[traitKey]?.data ?? {});
                const traitData = await resolveTraitValue(resolverInput);
                return {
                    ...acc,
                    ...traitData,
                };
            }, resolveValue(resolverInput));
            const defaultAssociations = {
                workspace: isSiteworkspaceFactory(defaultData.workspace) ? {
                    create: await defaultData.workspace.build()
                } : defaultData.workspace
            };
            const data = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...filteredInputData };
            await handleAfterBuild(data, transientFields);
            return data;
        };
        const buildList = (...args) => Promise.all(normalizeList(...args).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = async (inputData = {}) => {
            const data = await build({ ...inputData }).then(screen);
            const [transientFields] = destructure(defaultTransientFieldValues, inputData);
            await handleBeforeCreate(data, transientFields);
            const createdData = await getClient().site.create({ data });
            await handleAfterCreate(createdData, transientFields);
            return createdData;
        };
        const createList = (...args) => Promise.all(normalizeList(...args).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Site",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return {
        ...factory,
        use: useTraits,
    };
}
/**
 * Define factory for {@link Site} model.
 *
 * @param options
 * @returns factory {@link SiteFactoryInterface}
 */
export const defineSiteFactory = ((options) => {
    return defineSiteFactoryInternal(options, {});
});
defineSiteFactory.withTransientFields = defaultTransientFieldValues => options => defineSiteFactoryInternal(options, defaultTransientFieldValues);
