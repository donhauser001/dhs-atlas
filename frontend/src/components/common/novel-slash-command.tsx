import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Text,
  TextQuote,
} from 'lucide-react';
import { createSuggestionItems, Command, renderItems } from 'novel';
import { uploadFn } from './novel-image-upload';

export const suggestionItems = createSuggestionItems([
  {
    title: '正文',
    description: '普通文本段落',
    searchTerms: ['p', 'paragraph', 'text', '正文', '段落'],
    icon: <Text className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
    },
  },
  {
    title: '标题 1',
    description: '大标题',
    searchTerms: ['title', 'big', 'large', 'h1', '标题', '大标题'],
    icon: <Heading1 className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: '标题 2',
    description: '中标题',
    searchTerms: ['subtitle', 'medium', 'h2', '中标题'],
    icon: <Heading2 className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: '标题 3',
    description: '小标题',
    searchTerms: ['subtitle', 'small', 'h3', '小标题'],
    icon: <Heading3 className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: '待办列表',
    description: '可勾选的任务列表',
    searchTerms: ['todo', 'task', 'list', 'check', 'checkbox', '任务', '待办'],
    icon: <CheckSquare className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: '无序列表',
    description: '简单的项目符号列表',
    searchTerms: ['unordered', 'point', 'bullet', '列表', '无序'],
    icon: <List className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: '有序列表',
    description: '带编号的列表',
    searchTerms: ['ordered', 'number', '编号', '有序'],
    icon: <ListOrdered className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: '引用',
    description: '引用文本块',
    searchTerms: ['blockquote', 'quote', '引用'],
    icon: <TextQuote className="h-5 w-5" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').toggleBlockquote().run(),
  },
  {
    title: '代码块',
    description: '代码片段',
    searchTerms: ['codeblock', 'code', '代码'],
    icon: <Code className="h-5 w-5" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: '图片',
    description: '上传或嵌入图片',
    searchTerms: ['photo', 'picture', 'media', 'image', '图片', '图像'],
    icon: <ImageIcon className="h-5 w-5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const url = await uploadFn(file, editor.view);
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }
      };
      input.click();
    },
  },
]);

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
