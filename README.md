# Thinfinity Application as a Service

This is a simplified (and limited) version of CloudManager for easier managing of basic commands.

It follows this convention for displaying model instances:

1. It parses `friendlyName` and splits terms by "-" delimiter
2. The first term should always be username, it will filter it against logged username to display those models and instances
3. Models will take the name from 'desc' param or extract the name from the second term

## Example

We are logged as "user1", the app gets the models.

For the following `friendlyName` "user1-Excel", it will display the tab "Excel" or the desc param.

If there is a model with `friendlyName` of "some_user-Excel", it will not be visible.

Then it will fetch all instances related to that model's id.

---

This has 2 working modes: Standalone App (deployed as a separate application) and Plugin (loaded inside Thinfinity Workspace via the plugin architecture).

## Standalone mode

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

## Plugin mode

First-time setup — registers the plugin in the host's `plugins.json` and creates a symlink from the workspace plugins folder to the local build output:

```bash
npm run install-plugin
```

Dev (watch mode, no minification):
```bash
npm run dev:plugin
```

Build:
```bash
npm run build:plugin
```
