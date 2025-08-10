import { DependencyContainer } from 'tsyringe';
import { EVENT_PARSER, IEventParser } from 'types/services/LogParser/IEventParser';
import { TakeDamageParser } from 'services/LogParser/parsers/TakeDamageParser';

export const registerParsers = (container: DependencyContainer): void => {

    container.register<IEventParser[]>(EVENT_PARSER, {
        useFactory: (c: DependencyContainer) => {
            return [
                c.resolve(TakeDamageParser)
            ];
        }
    });
};