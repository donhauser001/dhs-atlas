'use client';

import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';

// 自定义 Paragraph 扩展，支持 style 属性（用于缩进和行距）
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) {
            return {};
          }
          return { style: attributes.style };
        },
      },
    };
  },
});

// 自定义 Heading 扩展，支持 style 属性（用于行距）
const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) {
            return {};
          }
          return { style: attributes.style };
        },
      },
    };
  },
});

// 图片组件 - 带可编辑图注
function ImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title, width, align, showCaption } = node.attrs;

  // 计算容器样式
  const containerStyle: React.CSSProperties = {
    width: width || 'auto',
    marginLeft: align === 'right' ? 'auto' : align === 'center' ? 'auto' : '0',
    marginRight: align === 'left' ? 'auto' : align === 'center' ? 'auto' : '0',
  };

  // 图片样式
  const imgStyle: React.CSSProperties = {
    width: '100%',
    display: 'block',
    borderRadius: '0.5rem',
    cursor: 'pointer',
  };

  return (
    <NodeViewWrapper
      className={`image-node-view ${selected ? 'is-selected' : ''}`}
      data-align={align || 'center'}
    >
      <figure className="image-figure" style={containerStyle}>
        <img
          src={src}
          alt={alt || ''}
          title={title || ''}
          style={imgStyle}
          className={selected ? 'image-selected' : ''}
          draggable={false}
        />
        {showCaption && (
          <figcaption className="image-caption-editable">
            <input
              type="text"
              value={title || ''}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              placeholder="输入图注..."
              className="image-caption-input"
              onClick={(e) => e.stopPropagation()}
            />
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
}

// 自定义 Image 扩展，支持更多属性和 NodeView
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => {
          const figure = element.closest('figure');
          if (figure) {
            const dataWidth = figure.getAttribute('data-width');
            if (dataWidth && dataWidth !== '') return dataWidth;
            const figureStyle = figure.getAttribute('style') || '';
            const widthMatch = figureStyle.match(/width:\s*([^;]+)/);
            return widthMatch ? widthMatch[1].trim() : null;
          }
          const dataWidth = element.getAttribute('data-width');
          if (dataWidth && dataWidth !== '') return dataWidth;
          const styleAttr = element.getAttribute('style') || '';
          const widthMatch = styleAttr.match(/width:\s*([^;]+)/);
          return widthMatch ? widthMatch[1].trim() : null;
        },
        renderHTML: () => ({}),
      },
      align: {
        default: 'center',
        parseHTML: element => {
          const figure = element.closest('figure');
          if (figure) {
            const dataAlign = figure.getAttribute('data-align');
            return (dataAlign && dataAlign !== '') ? dataAlign : 'center';
          }
          const dataAlign = element.getAttribute('data-align');
          return (dataAlign && dataAlign !== '') ? dataAlign : 'center';
        },
        renderHTML: () => ({}),
      },
      showCaption: {
        default: false,
        parseHTML: element => {
          const figure = element.closest('figure');
          if (figure) {
            return figure.getAttribute('data-show-caption') === 'true' || figure.querySelector('figcaption') !== null;
          }
          return element.getAttribute('data-show-caption') === 'true';
        },
        renderHTML: () => ({}),
      },
    };
  },

  // 使用 React 组件渲染
  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },

  // 用于 HTML 输出（如复制粘贴、导出）- 返回简单 img，NodeView 负责渲染
  renderHTML({ HTMLAttributes }) {
    const { width, align, showCaption, style: _style, ...rest } = HTMLAttributes;

    const imgStyles: string[] = ['display: block', 'border-radius: 0.5rem'];

    // 保存宽度到 style 和 data 属性
    const finalWidth = width || null;
    if (finalWidth) {
      imgStyles.push(`width: ${finalWidth}`);
    }

    // 保存对齐方式到 style
    const finalAlign = align || 'center';
    if (finalAlign === 'left') {
      imgStyles.push('margin-right: auto', 'margin-left: 0');
    } else if (finalAlign === 'right') {
      imgStyles.push('margin-left: auto', 'margin-right: 0');
    } else {
      imgStyles.push('margin-left: auto', 'margin-right: auto');
    }

    return ['img', {
      src: rest.src,
      alt: rest.alt || '',
      title: rest.title || '',
      'data-width': finalWidth || '',
      'data-align': finalAlign,
      'data-show-caption': showCaption ? 'true' : 'false',
      'data-title': rest.title || '',
      style: imgStyles.join('; '),
    }];
  },

  // 从 HTML 解析
  parseHTML() {
    return [
      {
        tag: 'figure.image-figure img',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          const figure = img.closest('figure');
          const figcaption = figure?.querySelector('figcaption');

          // 从 figure 的 style 属性中提取宽度
          const figureStyle = figure?.getAttribute('style') || '';
          const widthMatch = figureStyle.match(/width:\s*([^;]+)/);
          const extractedWidth = widthMatch ? widthMatch[1].trim() : null;

          const dataWidth = figure?.getAttribute('data-width');
          const dataAlign = figure?.getAttribute('data-align');
          const dataShowCaption = figure?.getAttribute('data-show-caption');

          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title: figcaption?.textContent || img.getAttribute('data-title') || img.getAttribute('title') || '',
            width: (dataWidth && dataWidth !== '') ? dataWidth : extractedWidth || null,
            align: (dataAlign && dataAlign !== '') ? dataAlign : 'center',
            showCaption: dataShowCaption === 'true' || figcaption !== null,
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          // 从 style 属性中提取宽度
          const styleAttr = img.getAttribute('style') || '';
          const widthMatch = styleAttr.match(/width:\s*([^;]+)/);
          const extractedWidth = widthMatch ? widthMatch[1].trim() : null;

          // 获取 data 属性，确保处理空字符串
          const dataWidth = img.getAttribute('data-width');
          const dataAlign = img.getAttribute('data-align');
          const dataShowCaption = img.getAttribute('data-show-caption');
          const dataTitle = img.getAttribute('data-title');

          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title: dataTitle || img.getAttribute('title') || '',
            width: (dataWidth && dataWidth !== '') ? dataWidth : extractedWidth || null,
            align: (dataAlign && dataAlign !== '') ? dataAlign : 'center',
            showCaption: dataShowCaption === 'true',
          };
        },
      },
    ];
  },
});
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  Palette,
  Quote,
  Code,
  Minus,
  X,
  Heading1,
  Heading2,
  Heading3,
  Type,
  ChevronDown,
  IndentIncrease,
  IndentDecrease,
  ChevronsUpDown,
  Settings2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, useCallback } from 'react';
import '@/styles/rich-text-editor.css';

// 预设颜色
const TEXT_COLORS = [
  { name: '默认', color: null },
  { name: '红色', color: '#ef4444' },
  { name: '橙色', color: '#f97316' },
  { name: '黄色', color: '#eab308' },
  { name: '绿色', color: '#22c55e' },
  { name: '蓝色', color: '#3b82f6' },
  { name: '紫色', color: '#8b5cf6' },
  { name: '灰色', color: '#6b7280' },
];

const HIGHLIGHT_COLORS = [
  { name: '无', color: null },
  { name: '黄色', color: '#fef08a' },
  { name: '绿色', color: '#bbf7d0' },
  { name: '蓝色', color: '#bfdbfe' },
  { name: '粉色', color: '#fbcfe8' },
  { name: '紫色', color: '#ddd6fe' },
];

// 行距预设
const LINE_HEIGHTS = [
  { name: '单倍', value: '1.5' },
  { name: '1.5倍', value: '1.75' },
  { name: '1.75倍', value: '2' },
  { name: '双倍', value: '2.5' },
  { name: '3倍', value: '3' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

// 图片尺寸预设
const IMAGE_SIZES = [
  { name: '小', value: '25%' },
  { name: '中', value: '50%' },
  { name: '大', value: '75%' },
  { name: '全宽', value: '100%' },
  { name: '原始', value: 'auto' },
];

// 图片对齐方式
const IMAGE_ALIGNS = [
  { name: '左对齐', value: 'left', icon: AlignLeft },
  { name: '居中', value: 'center', icon: AlignCenter },
  { name: '右对齐', value: 'right', icon: AlignRight },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  className,
  minHeight = '200px',
  onImageUpload,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false);
  const [selectedImageNode, setSelectedImageNode] = useState<{
    src: string;
    alt: string;
    title: string;
    width: string;
    align: string;
    showCaption: boolean;
  } | null>(null);
  const [isImageActive, setIsImageActive] = useState(false);
  const [showImageToolbar, setShowImageToolbar] = useState(false);
  const [imageToolbarPosition, setImageToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const imageToolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // 禁用默认的 paragraph 和 heading，使用自定义版本
          paragraph: false,
          heading: false,
        }),
        // 使用自定义的 Paragraph 和 Heading（支持 style 属性）
        CustomParagraph,
        CustomHeading.configure({
          levels: [1, 2, 3, 4],
        }),
        Placeholder.configure({
          placeholder,
        }),
        Underline,
        CustomImage.configure({
          inline: false,
          allowBase64: true,
          HTMLAttributes: {
            class: 'rich-text-image',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
          },
        }),
        TextAlign.configure({
          types: ['paragraph', 'heading'],
        }),
        Highlight.configure({
          multicolor: true,
        }),
        TextStyle,
        Color,
      ],
      content: value,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        setIsImageActive(editor.isActive('image'));
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none focus:outline-none',
            'px-3 py-2'
          ),
          style: `min-height: ${minHeight}`,
        },
      },
    },
    []
  );

  // 当外部 value 变化时更新编辑器内容
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // 使用 emitUpdate: false 避免触发不必要的 onUpdate
      // preserveWhitespace: 'full' 确保完整解析 HTML
      editor.commands.setContent(value, false, {
        preserveWhitespace: 'full',
      });
    }
  }, [value, editor]);

  // 设置链接
  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkPopoverOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // 控制图片工具栏的显示（带延迟隐藏）
  // 使用 effect 来处理所有状态更新，避免在渲染期间访问 ref
  useEffect(() => {
    if (isImageActive) {
      // 取消任何待处理的隐藏操作
      if (imageToolbarTimeoutRef.current) {
        clearTimeout(imageToolbarTimeoutRef.current);
        imageToolbarTimeoutRef.current = null;
      }
      setShowImageToolbar(true);
    } else {
      // 延迟隐藏工具栏
      imageToolbarTimeoutRef.current = setTimeout(() => {
        setShowImageToolbar(false);
      }, 300);
    }

    return () => {
      if (imageToolbarTimeoutRef.current) {
        clearTimeout(imageToolbarTimeoutRef.current);
      }
    };
  }, [isImageActive]);

  // 检查是否选中了图片
  const isImageSelected = showImageToolbar;

  // 保存当前图片的 src，用于查找
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);

  // 获取选中图片的属性 - 直接从 Tiptap 节点获取
  const getSelectedImageAttrs = useCallback(() => {
    if (!editor || !isImageSelected) return null;

    // 从 Tiptap 获取属性
    const attrs = editor.getAttributes('image');

    return {
      src: attrs.src || '',
      alt: attrs.alt || '',
      title: attrs.title || '',
      width: attrs.width || 'auto',
      align: attrs.align || 'center',
      showCaption: attrs.showCaption ?? false,
    };
  }, [editor, isImageSelected]);

  // 当选中图片时，保存其 src 并计算工具栏位置
  useEffect(() => {
    if (editor && isImageActive) {
      const attrs = editor.getAttributes('image');
      if (attrs.src) {
        // 计算工具栏位置（相对于编辑器容器）
        // 使用 requestAnimationFrame 确保 NodeView 已渲染，并在回调中更新状态
        requestAnimationFrame(() => {
          // 在异步回调中更新状态，避免同步 setState
          setCurrentImageSrc(attrs.src);

          if (editorContainerRef.current) {
            const editorElement = editor.view.dom;
            const imgElements = editorElement.querySelectorAll('img');

            let targetImg: HTMLImageElement | null = null;
            imgElements.forEach((img) => {
              const htmlImg = img as HTMLImageElement;
              if (htmlImg.src === attrs.src || htmlImg.src.includes(attrs.src.slice(0, 50))) {
                targetImg = htmlImg;
              }
            });

            if (targetImg) {
              const containerRect = editorContainerRef.current.getBoundingClientRect();
              const imgRect = targetImg.getBoundingClientRect();

              setImageToolbarPosition({
                top: imgRect.bottom - containerRect.top + 8,
                left: imgRect.left - containerRect.left + imgRect.width / 2,
              });
            }
          }
        });
      }
    } else {
      // 使用 requestAnimationFrame 来避免同步 setState
      requestAnimationFrame(() => {
        setImageToolbarPosition(null);
      });
    }
  }, [editor, isImageActive]);

  // 更新图片属性 - NodeView 会自动重新渲染
  const updateImageAttrs = useCallback((attrs: { width?: string; align?: string; alt?: string; title?: string; showCaption?: boolean }) => {
    if (!editor) return;

    const { state, view } = editor;

    // 查找图片节点
    let imagePos: number | null = null;
    let imageNode: { attrs: Record<string, unknown> } | null = null;

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'image') {
        if (currentImageSrc && node.attrs.src) {
          if (node.attrs.src === currentImageSrc || node.attrs.src.includes(currentImageSrc.slice(0, 50))) {
            imagePos = pos;
            imageNode = node;
            return false;
          }
        } else if (!imagePos) {
          imagePos = pos;
          imageNode = node;
        }
      }
      return true;
    });

    if (imagePos !== null && imageNode) {
      // 构建新属性
      const newAttrs = { ...imageNode.attrs };

      if (attrs.width !== undefined) {
        newAttrs.width = attrs.width === 'auto' ? null : attrs.width;
      }
      if (attrs.align !== undefined) {
        newAttrs.align = attrs.align;
      }
      if (attrs.alt !== undefined) {
        newAttrs.alt = attrs.alt || '';
      }
      if (attrs.title !== undefined) {
        newAttrs.title = attrs.title || '';
      }
      if (attrs.showCaption !== undefined) {
        newAttrs.showCaption = attrs.showCaption;
      }

      // 使用 setNodeMarkup 更新属性，NodeView 会自动重新渲染
      const tr = state.tr.setNodeMarkup(imagePos, undefined, newAttrs);
      view.dispatch(tr);

      // 更新 selectedImageNode 状态
      setSelectedImageNode(prev => prev ? { ...prev, ...newAttrs } : null);
    }

    setImageSettingsOpen(false);
  }, [editor, currentImageSrc]);

  // 删除图片
  const deleteImage = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteSelection().run();
    setImageSettingsOpen(false);
    setSelectedImageNode(null);
  }, [editor]);

  // 打开图片设置
  const openImageSettings = useCallback(() => {
    const attrs = getSelectedImageAttrs();
    if (attrs) {
      setSelectedImageNode(attrs);
      setImageSettingsOpen(true);
    }
  }, [getSelectedImageAttrs]);

  // 处理图片上传
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      let imageUrl: string;

      if (onImageUpload) {
        // 使用自定义上传函数
        imageUrl = await onImageUpload(file);
      } else {
        // 默认转换为 Base64
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      console.error('图片上传失败:', error);
    }

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor, onImageUpload]);

  // 打开链接弹窗时获取当前链接
  const openLinkPopover = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkPopoverOpen(true);
  }, [editor]);

  if (!editor) {
    return (
      <div className={cn('border rounded-md', className)}>
        <div className="h-10 border-b bg-muted/30" />
        <div className="px-3 py-2" style={{ minHeight }}>
          <span className="text-muted-foreground">{placeholder}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-md overflow-hidden flex flex-col', className)}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-start content-start gap-0.5 p-1.5 border-b bg-muted/30 flex-shrink-0">
        {/* 文本层级 */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 gap-1 text-xs font-normal"
              title="文本层级"
            >
              {editor.isActive('heading', { level: 1 }) ? (
                <><Heading1 className="h-4 w-4" /><span>标题1</span></>
              ) : editor.isActive('heading', { level: 2 }) ? (
                <><Heading2 className="h-4 w-4" /><span>标题2</span></>
              ) : editor.isActive('heading', { level: 3 }) ? (
                <><Heading3 className="h-4 w-4" /><span>标题3</span></>
              ) : (
                <><Type className="h-4 w-4" /><span>正文</span></>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                editor.chain().focus().setParagraph().run();
              }}
              className={cn(editor.isActive('paragraph') && !editor.isActive('heading') && 'bg-muted')}
            >
              <Type className="h-4 w-4 mr-2" />
              正文
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                editor.chain().focus().setHeading({ level: 1 }).run();
              }}
              className={cn(editor.isActive('heading', { level: 1 }) && 'bg-muted')}
            >
              <Heading1 className="h-4 w-4 mr-2" />
              标题 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                editor.chain().focus().setHeading({ level: 2 }).run();
              }}
              className={cn(editor.isActive('heading', { level: 2 }) && 'bg-muted')}
            >
              <Heading2 className="h-4 w-4 mr-2" />
              标题 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                editor.chain().focus().setHeading({ level: 3 }).run();
              }}
              className={cn(editor.isActive('heading', { level: 3 }) && 'bg-muted')}
            >
              <Heading3 className="h-4 w-4 mr-2" />
              标题 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 文字格式 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('bold') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="粗体"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('italic') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('underline') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="下划线"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('strike') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="删除线"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 文字颜色 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="文字颜色"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {TEXT_COLORS.map((item) => (
              <DropdownMenuItem
                key={item.name}
                onClick={() => {
                  if (item.color) {
                    editor.chain().focus().setColor(item.color).run();
                  } else {
                    editor.chain().focus().unsetColor().run();
                  }
                }}
              >
                <span
                  className="w-4 h-4 rounded mr-2 border"
                  style={{ backgroundColor: item.color || 'transparent' }}
                />
                {item.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 高亮 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', editor.isActive('highlight') && 'bg-muted')}
              title="高亮"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {HIGHLIGHT_COLORS.map((item) => (
              <DropdownMenuItem
                key={item.name}
                onClick={() => {
                  if (item.color) {
                    editor.chain().focus().toggleHighlight({ color: item.color }).run();
                  } else {
                    editor.chain().focus().unsetHighlight().run();
                  }
                }}
              >
                <span
                  className="w-4 h-4 rounded mr-2 border"
                  style={{ backgroundColor: item.color || 'transparent' }}
                />
                {item.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 对齐 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="左对齐"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="居中"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="右对齐"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive({ textAlign: 'justify' }) && 'bg-muted')}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="两端对齐"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 缩进 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const isHeading = editor.isActive('heading');
            const nodeType = isHeading ? 'heading' : 'paragraph';
            const currentStyle = editor.getAttributes(nodeType).style || '';
            const match = currentStyle.match(/margin-left:\s*(\d+)px/);
            const currentIndent = match ? parseInt(match[1]) : 0;
            const newIndent = Math.max(0, currentIndent - 24);

            let newStyle: string;
            if (newIndent === 0) {
              newStyle = currentStyle.replace(/margin-left:\s*\d+px;?\s*/g, '').trim();
            } else if (match) {
              newStyle = currentStyle.replace(/margin-left:\s*\d+px/, `margin-left: ${newIndent}px`);
            } else {
              newStyle = currentStyle;
            }

            editor.chain().focus().updateAttributes(nodeType, { style: newStyle }).run();
          }}
          title="减少缩进"
        >
          <IndentDecrease className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const isHeading = editor.isActive('heading');
            const nodeType = isHeading ? 'heading' : 'paragraph';
            const currentStyle = editor.getAttributes(nodeType).style || '';
            const match = currentStyle.match(/margin-left:\s*(\d+)px/);
            const currentIndent = match ? parseInt(match[1]) : 0;
            const newIndent = currentIndent + 24;

            let newStyle: string;
            if (match) {
              newStyle = currentStyle.replace(/margin-left:\s*\d+px/, `margin-left: ${newIndent}px`);
            } else {
              newStyle = `margin-left: ${newIndent}px; ${currentStyle}`.trim();
            }

            editor.chain().focus().updateAttributes(nodeType, { style: newStyle }).run();
          }}
          title="增加缩进"
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>

        {/* 行距 */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 gap-1 text-xs font-normal"
              title="行距"
            >
              <ChevronsUpDown className="h-4 w-4" />
              <span>行距</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
            {LINE_HEIGHTS.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onSelect={(e) => {
                  e.preventDefault();
                  // 检测当前是 paragraph 还是 heading
                  const isHeading = editor.isActive('heading');
                  const nodeType = isHeading ? 'heading' : 'paragraph';
                  const currentStyle = editor.getAttributes(nodeType).style || '';

                  const newStyle = (() => {
                    if (currentStyle.includes('line-height')) {
                      return currentStyle.replace(/line-height:\s*[\d.]+/, `line-height: ${item.value}`);
                    }
                    return `line-height: ${item.value}; ${currentStyle}`.trim();
                  })();

                  editor.chain().focus().updateAttributes(nodeType, { style: newStyle }).run();
                }}
              >
                {item.name}行距
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 列表 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('bulletList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="无序列表"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('orderedList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* 引用和代码 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('blockquote') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="引用"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('code') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="行内代码"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 链接 */}
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', editor.isActive('link') && 'bg-muted')}
              onClick={openLinkPopover}
              title="链接"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <Label>链接地址</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setLink();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={setLink}>
                  确定
                </Button>
                {editor.isActive('link') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkPopoverOpen(false);
                    }}
                  >
                    移除链接
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 图片 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          title="插入图片"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* 分割线 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分割线"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 撤销/重做 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="撤销"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="重做"
        >
          <Redo className="h-4 w-4" />
        </Button>

        {/* 清除格式 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="清除格式"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 编辑区域 */}
      <div ref={editorContainerRef} className="flex-1 overflow-auto relative">
        <EditorContent editor={editor} />

        {/* 图片设置工具栏 - 当选中图片时显示在图片下方 */}
        {isImageSelected && imageToolbarPosition && (
          <div
            className="absolute z-10 -translate-x-1/2"
            style={{
              top: imageToolbarPosition.top,
              left: imageToolbarPosition.left,
            }}
            onMouseDown={(e) => {
              // 只对非输入元素阻止默认行为
              const target = e.target as HTMLElement;
              if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                e.preventDefault();
              }
            }}
            onMouseEnter={() => {
              // 鼠标进入工具栏时，清除隐藏定时器
              if (imageToolbarTimeoutRef.current) {
                clearTimeout(imageToolbarTimeoutRef.current);
              }
              setShowImageToolbar(true);
            }}
          >
            <div className="flex items-center gap-1 p-1.5 bg-popover border rounded-lg shadow-lg">
              {/* 尺寸选择 */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    尺寸
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onPointerDownOutside={(e) => e.preventDefault()}
                >
                  {IMAGE_SIZES.map((size) => (
                    <DropdownMenuItem
                      key={size.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={(e) => {
                        e.preventDefault();
                        updateImageAttrs({ width: size.value });
                      }}
                    >
                      {size.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-5" />

              {/* 对齐方式 */}
              {IMAGE_ALIGNS.map((align) => (
                <Button
                  key={align.value}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateImageAttrs({ align: align.value })}
                  title={align.name}
                >
                  <align.icon className="h-4 w-4" />
                </Button>
              ))}

              <Separator orientation="vertical" className="h-5" />

              {/* 图片设置 */}
              <Popover open={imageSettingsOpen} onOpenChange={setImageSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={openImageSettings}
                    title="图片设置"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>图片描述 (Alt)</Label>
                      <Input
                        value={selectedImageNode?.alt || ''}
                        onChange={(e) => setSelectedImageNode(prev => prev ? { ...prev, alt: e.target.value } : null)}
                        placeholder="描述图片内容"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>图注 (Title)</Label>
                      <Input
                        value={selectedImageNode?.title || ''}
                        onChange={(e) => setSelectedImageNode(prev => prev ? { ...prev, title: e.target.value } : null)}
                        placeholder="图片标题/图注"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-caption" className="text-sm">在下方显示图注</Label>
                      <Switch
                        id="show-caption"
                        checked={selectedImageNode?.showCaption || false}
                        onCheckedChange={(checked) => setSelectedImageNode(prev => prev ? { ...prev, showCaption: checked } : null)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedImageNode) {
                            updateImageAttrs({
                              alt: selectedImageNode.alt,
                              title: selectedImageNode.title,
                              showCaption: selectedImageNode.showCaption,
                            });
                          }
                        }}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setImageSettingsOpen(false)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* 删除图片 */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={deleteImage}
                title="删除图片"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
