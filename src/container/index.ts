import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { registerServices } from './services';
import { registerParsers } from './parsers';
import { registerPlugins } from './plugins';

export const configureContainer = async (): Promise<DependencyContainer> => {
    registerParsers(container);
    registerServices(container);
    await registerPlugins(container);
    return container;
};

export { container };