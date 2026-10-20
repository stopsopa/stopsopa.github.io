# Language

Speak English

# Format of conversation

Start every single response with my name. My name is Sempronius Densus

# Project Instructions

<VERY IMPORTANT>

- By default stick to grug skill unless asked otherwise
- don't run any cli commands. If you need it then ask me to run them.
- Don't generate summary at the end - just do what asked and just report "done". You might list relative paths (relative to project root) to files changed/deleted/created.
- use tokens sparingly do stuff in one go
- never run any commands yourself. If needed just ask. I will run it and provide you with the result.

VERY IMPORTANT:
VERY IMPORTANT:
Attention control: When given the task, try to limit how many files you read (limit sniffing around the project). Usually try to limit yourself to files which were mentioned in the prompt.
If you think there is a need to look into other files then gather a list of files you would like to look into and ask before reading them.

Sometimes it seems AI is going astray and starts parsing half of the project burning through quarter of millions of tokens in the spand of few seconds where task didn't really require looking into that many files. Try to avoid that.
VERY IMPORTANT:
VERY IMPORTANT:

</VERY IMPORTANT>

<READING-FILE>
When reading files specified in the context read them whole into the context, don't come and read them chunk by chunk.
Just read in one go given file and then continue with reasoning. 
</READING-FILE>

<general code logic>
avoid negated conditions where else is present:

```

if ( ! condition) {
    ... something else 1
}
else {
    ... something else 2
}

```

when else is present just remove NOT and swap blocks

```

if ( condition) {
    ... something else 2
}
else {
    ... something else 1
}

```

</general code logic>

<bash>
VERY IMPORTANT
VERY IMPORTANT
VERY IMPORTANT
VERY IMPORTANT
when working with bash and generally any shell script absolutely always follow 'bash-scripting' skill
</bash>

<existing code comments>
IMPORTANT:
IMPORTANT:
IMPORTANT:
When you working with existing code and there are comments around functions and generally comment explaining what is happening then leave them all in place.
The same for comments demonstrating how to use given library or script. Those have to say.
Can be only extended. Like new examples added to the comment. That is desirable if covers new cases/ new arguments or new functionalities. Everywhere where logic can be modified by external aruguments or by different ways of callins script and so on.

Also above avery new function and even moderately important functionality block or separate unit of logic it is desirable to also have new comments describing the intention and purpose of that function or functionality.

if just one line of comment is needed then use singe line comments (like with two slashes in js).
But if more than one then use comment type (/\*_ ... _/).
IMPORTANT:
IMPORTANT:
IMPORTANT:
</existing code comments>

<css>
In this project we cant use scss. We have to use only css.

Always use just css. Use nesting in css since modern browsers support it, like

```
.my_box {
    background: red;

    .my_inner_box {
        ...
    }
}

```

Ideally also try to introduce style next to the components and import in that component like

Test.tsx
Test.css

and do

import './Test.css'

in Test.tsx

Try to keep styles local to the component as much as possible.

if you need though some universal styles which makes sense to reuse then put it into src/index.css
</css>

<react>
When modeling react components try to don't use useCallback as an optimisation.
Avoid premature optimisation.
Use it though when it seems important for performance or for the logic. When it is obvious that rerender will happen many times per second and it will be reasonable to use it.
Just avoid premature optimisation. Most of the time it only generates noise in the code. Especially when final solution is still in the process of making.
</react>

<end to end testing>
When building end to end tests make sure that all elements we interact with have data-testid attribute (If we can help it - if given code is in control of this project) and use that to to find elements. This way modifying ui I have clear picture where I should be careful when modifying layout because of given data-testid is important for some tests.
</end to end testing>

<ui>

When building interactive elements. Generally when building UI make sure to always add unique data-testid to every interactive element user will be pressing, touching and any other interaction. Also all emenents you suspsect will be touched by end to end testing

</ui>
