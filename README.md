# Thinfinity Application as a Service

This is a simplified (and limited) version of CloudManager for easiear managing of basic commands.

It follows this convention for displaying model instances:

1. It parses `firendlyName` and splits therms by "-" delimiter
2. The firs therm should always be username, it will filter it against logged username to display those models and instances
3. Models will take the name from 'desc' param or extract the name from the second therm

## Example

We are logged as "user1", the app gets the models.

For the following `friendlyName` "user1-Excel", it will display the tab "Excel" or the desc param.

If there is a model with `friendlyName` of "some_user-Excel", it will not be visible.

The it will fetch all instances related to that models id.


## Modes

This has 2 working modes.. Standalone App (the app deployed as a separate application) and Plugin (to work inside Thinfinity Workspace with the new plugin architecture)

### Standalone

For this mode add aliases to **webaliases.ini** under bin64 on main repo.  
You can copy them from webaliases.example.ini

Run dev mode:

```bash
npm run dev
```

Build:
```bash
npm run build
```

### Plugin mode

```bash
npm run dev:plugin
```

Build plugin

```bash
npm run dev:plugin
```
