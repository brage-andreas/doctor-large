## Quick start

1. Create a `.env` file and fill it in using the `.env.example` file
2. Install PostgreSQL and pgAdmin4
3. Create a server with password "admin" called "postgres"
4. Create a database called "doctor-large"
5. Run `npx prisma db push`
6. Run `npm run start`

### Publish or remove commands
 
1. Copy the bot's user ID in `.env` file. (Optional) Copy the desired guild's ID in the `.env` file.
2. Run `npm run publishCommands` or `npm run removeCommands` to publish or remove commands.
