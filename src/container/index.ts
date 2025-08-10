import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { registerServices } from './services';
import { registerParsers } from './parsers';

export const configureContainer = (): DependencyContainer => {
    registerParsers(container);
    registerServices(container);
    return container;
};

export { container };