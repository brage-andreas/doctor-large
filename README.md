## Quick start

1. Create a `.env` file and populate it. Use `.env.example` as a reference.
2. Install PostgreSQL and Node.js.
3. Create a server with name `postgres` and password `admin`.
4. Create a database called `doctor-large`.
5. Run `npm install`
5. Run `npx prisma db push`.
6. Run `npm run start`.

## Publish or remove commands
 
1. Populate the `CLIENT_ID` key in your `.env` file with your bot's user id.

	(Optional) Populate the `GUILD_ID` key in your `.env` file with your desired guild's ID.

2. Run `npm run commands:put` or `npm run commands:clear` to put or clear commands.


## Creating commands

- Commands go in `./src/commands/*`.
- Commands can be nested two layers.
- Files can be prefixed with `mod.` to be ignored.
- Files can be nested at least three layers deep to be ignored.
- Commands must export a function `getCommand` that when called returns a function returning an object implementing the `CommandExport` type.

### File structure example:
```
src/
├── commands/
│   ├── commandFile.ts
│   ├── mod.thisFileWillBeIgnored.ts
│   └── folder/
│       ├── otherCommandFile.ts
│       ├── mod.thisFileWillBeIgnored.ts
│       └── nestedFolder/
│           ├── thisFileWillBeIgnored.ts
│           └── andAnyDeeperNestedFiles.ts
...
```

### File example:
```ts
// ... Imports

// You need one of `chatInput` and `contextMenu`. You can have both.
const data: CommandData = {
	chatInput: {
		name: "name",
		description: "description",
		// rest of data...
	},
	contextMenu: {
		name: "name",
		// rest of data...
	}
};

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	// `interaction` is untouched.
	//    (you should deferReply atop this function if applicable)
	
	// Code here...
};

const contextMenu = async (
	// You want to type this as either:
	//  - MessageContextMenuCommandInteraction
	//  - UserContextMenuCommandInteraction
	interaction: ContextMenuCommandInteraction<"cached">
) => {
	// `interaction` is untouched.
	//    (you should deferReply atop this function if applicable)

	// Code here...
};

const autocomplete = async (
	interaction: AutocompleteInteraction<"cached">
) => {
	// Only needed if you have at least one option with `autocomplete: true` .

	// Code here...
}

// This *must* be present in every command file.
export const getCommand: () => Command = () => ({
	data,
	handle: {
		// at least one is needed
		// `autocomplete` cannot be present without `chatInput`
		chatInput,
		contextMenu,
		autocomplete
	}
});
```

## Creating events
- Events go in `./src/events`.
- Events cannot be nested. Any nested files will be ignored.
- Events must export a function `getEvent` that when called returns a function returning an object implementing the `EventExport` type.
- The function `execute` has the parameters as defined in discord.js' documentation.
  (Exception: `ready` event, which is given the client.)

### File structure example:
```
src/
├── events/
│   ├── eventFile.ts
│   └── folder/
│       ├── thisFileWillBeIgnored.ts
│       └── andAnyDeeperNestedFiles.ts
...
```

### File example:
```ts
// ... Imports

// Change the params as per discord.js documentation
const execute = (client: Client<true>) => {
	// Code here...
};

export const getEvent: () => EventExport = () => ({
	// Change this to be the event you want
	event: Events.ClientReady,
	execute
});
```
