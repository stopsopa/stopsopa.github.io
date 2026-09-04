// compile bin/executable

#include <stdio.h>
#include <string.h>

/*
 * Print all environment variables with color-coding:
 * - Variable name: Yellow (\x1b[33m)
 * - Separator '=': White (\x1b[37m)
 * - Variable value: Green (\x1b[32m)
 */
int main(int argc, char **argv, char **envp)
{
    (void)argc;
    (void)argv;

    for (int i = 0; envp[i] != NULL; ++i) {
        char *entry = envp[i];
        char *eq = strchr(entry, '=');

        if (eq == NULL) {
            // Fallback if no '=' present
            printf("\x1b[33m%s\x1b[0m\n", entry);
        } else {
            // Print name up to '=', '=' in white, and value in green
            int name_len = (int)(eq - entry);
            printf("\x1b[33m%.*s\x1b[37m=\x1b[32m%s\x1b[0m\n", name_len, entry, eq + 1);
        }
    }

    return 0;
}