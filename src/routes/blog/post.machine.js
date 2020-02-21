import { Machine, assign } from 'xstate'

const messageMachine = Machine(
  {
    id: 'message',
    context: {
      text: '',
      url: '',
      username: '',
      message: '',
    },
    initial: 'editing',
    states: {
      editing: {
        on: {
          submit: {
            actions: 'assignMessageForm',
            target: 'submitting',
          },
          cancel: {
            target: 'cancelled',
          },
        },
      },
      submitting: {
        invoke: {
          id: 'post-message',
          src: invokePostMessage,
          onError: {
            target: 'failure',
            actions: evt => {
              alert(`Something went wrong`)
            },
          },
          onDone: {
            target: 'success',
          },
        },
      },
      success: {
        type: 'final',
      },
      failure: {
        type: 'final',
      },
      cancelled: {
        type: 'final',
      },
    },
  },
  {
    actions: {
      assignMessageForm: assign((_, evt) => {
        return {
          username: evt.username,
          message: evt.message,
        }
      }),
    },
  },
)

export const postMachine = Machine(
  {
    id: 'post',
    initial: 'idle',
    context: {
      url: '',
      selection: '',
      mouseX: null,
      mouseY: null,
    },
    states: {
      idle: {
        on: {
          mousedown: 'selecting',
          send_message: 'message',
        },
      },
      selecting: {
        entry: ['clearSelection'],
        on: {
          mouseup: [
            {
              target: 'selected',
              cond: 'hasSelection',
            },
            { target: 'idle' },
          ],
        },
      },
      selected: {
        entry: ['assignSelection'],
        on: {
          mousedown: 'selecting',
          send_message: 'message',
        },
      },
      message: {
        invoke: {
          src: messageMachine,
          autoForward: true,
          onDone: 'idle',
          data: context => {
            return {
              text: context.selection,
              url: context.url,
            }
          },
        },
        on: {
          keydown: {
            target: 'idle',
            cond: 'isEscape',
          },
        },
      },
    },
  },
  {
    guards: {
      hasSelection: () =>
        window
          .getSelection()
          .toString()
          .trim() !== '' &&
        window.getSelection().anchorNode.parentNode.closest('main') &&
        window.getSelection().focusNode.parentNode.closest('main'),
      isEscape: (_, evt) => evt.key === 'Escape',
    },
    actions: {
      assignSelection: assign(() => {
        const rect = window
          .getSelection()
          .getRangeAt(0)
          .getBoundingClientRect()

        return {
          selection: window.getSelection().toString(),
          mouseX: (rect.left + rect.right) / 2,
          mouseY: rect.bottom + document.documentElement.scrollTop,
        }
      }),
      clearSelection: assign(() => {
        return {
          selection: '',
          mouseX: null,
          mouseY: null,
        }
      }),
    },
  },
)

async function invokePostMessage(context) {
  return fetch(process.env.TD_SLACK_HOOK, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${context.message}`,
          },
        },
        {
          type: 'divider',
        },
        context.text
          ? {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Selection:*\n${context.text}`,
              },
            }
          : undefined,
        {
          type: 'context',
          elements: [
            {
              text: `${context.username || 'Anonymous'} | ${context.url}`,
              type: 'mrkdwn',
            },
          ],
        },
      ].filter(Boolean),
      icon_emoji: ':robot_face:',
      username: 'timdeschryver.dev',
    }),
  })
}
