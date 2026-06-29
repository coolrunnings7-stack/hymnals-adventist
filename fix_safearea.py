import sys, os

# ---- 1) App.js: move SafeAreaView to react-native-safe-area-context ----
ap = 'App.js'
if not os.path.exists(ap):
    print('ERROR: run from project folder'); sys.exit(1)
a = open(ap).read(); a_orig = a

old_imp = ("import {\n"
           "  SafeAreaView, View, Text, TextInput, FlatList, TouchableOpacity,\n"
           "  StyleSheet, StatusBar, ScrollView, Image,\n"
           "} from 'react-native';")
new_imp = ("import {\n"
           "  View, Text, TextInput, FlatList, TouchableOpacity,\n"
           "  StyleSheet, StatusBar, ScrollView, Image,\n"
           "} from 'react-native';\n"
           "import { SafeAreaView } from 'react-native-safe-area-context';")
assert a.count(old_imp) == 1, 'App.js import block not matched exactly (%d)' % a.count(old_imp)
a = a.replace(old_imp, new_imp, 1)

if all(a.count(o) == a.count(c) for o, c in [('(', ')'), ('{', '}'), ('[', ']')]):
    open(ap + '.presafe', 'w').write(a_orig)
    open(ap, 'w').write(a)
    print('App.js: SafeAreaView now from safe-area-context')
else:
    print('App.js unbalanced, not writing'); sys.exit(1)

# ---- 2) index.js: wrap App in SafeAreaProvider ----
ix = 'index.js'
i = open(ix).read(); i_orig = i
new_index = (
    "import { registerRootComponent } from 'expo';\n"
    "import React from 'react';\n"
    "import { SafeAreaProvider } from 'react-native-safe-area-context';\n"
    "import App from './App';\n"
    "\n"
    "function Root() {\n"
    "  return (\n"
    "    <SafeAreaProvider>\n"
    "      <App />\n"
    "    </SafeAreaProvider>\n"
    "  );\n"
    "}\n"
    "\n"
    "registerRootComponent(Root);\n"
)
open(ix + '.presafe', 'w').write(i_orig)
open(ix, 'w').write(new_index)
print('index.js: wrapped App in SafeAreaProvider')
print('OK')
