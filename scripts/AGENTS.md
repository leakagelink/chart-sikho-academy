## Rules
- Android system-bar colours are patched into the generated native theme by the `capacitor:sync:after` hook script; why: the android folder is generated on the developer machine, and older WebViews pad the window so its theme background shows behind the bars.
