# OpenSquad

Squad & Squad44 Scripting Framework

## In Development

OpenSquad is in early development stages. It is not yet useful

## Development

Currently the `PostScriptum.log` file is being used as a test-log file. You can simulate log changes by starting `scripts/simulateLogChanges.js`

`npm run dev` starts nodemon which watches the `src` directory.

### Adding a parser

1. Create a parser class (use `src\services\LogParser\parsers\TakeDamageParser.ts` as an example)
2. Create a new event type in `src\types\enums\EEventType.ts`
3. Define the parsed event interface in `src\types\services\LogParser\IParsedLog.ts`
4. Add it into the event map in `src\types\IEventMap.interface.ts`
5. Load the class into the container in `src\container\parsers.ts`

Whenever possible, every parser should support both games ( Squad & Squad44 ), if different parsing is required, you can do that by checking the `game` argument.

## Todo

- More parsers
- RCON support
- Database support
- Discord support
- Tests
