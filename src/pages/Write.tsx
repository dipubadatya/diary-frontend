
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'random-thoughts', label: 'Thought', icon: 'ri-lightbulb-line' },
  { value: 'poetry', label: 'Poetry', icon: 'ri-quill-pen-line' },
  { value: 'fiction', label: 'Fiction', icon: 'ri-book-open-line' },
  { value: 'drama', label: 'Adventure', icon: 'ri-compass-3-line' },
  { value: 'mystery', label: 'Mystery', icon: 'ri-search-eye-line' },
  { value: 'fantasy', label: 'Fantasy', icon: 'ri-magic-line' },
  { value: 'other', label: 'Other', icon: 'ri-more-line' },
];

const TEXT_COLORS = [
  { name: 'Default', value: 'inherit', swatch: 'bg-neutral-800 dark:bg-neutral-200' },
  { name: 'Ink', value: '#1a1a1a', swatch: 'bg-neutral-900' },
  { name: 'Sepia', value: '#8B4513', swatch: 'bg-amber-900' },
  { name: 'Crimson', value: '#DC2626', swatch: 'bg-red-600' },
  { name: 'Amber', value: '#D97706', swatch: 'bg-amber-600' },
  { name: 'Forest', value: '#059669', swatch: 'bg-emerald-600' },
  { name: 'Ocean', value: '#0284C7', swatch: 'bg-sky-600' },
  { name: 'Violet', value: '#7C3AED', swatch: 'bg-violet-600' },
  { name: 'Rose', value: '#E11D48', swatch: 'bg-rose-600' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent', swatch: 'bg-white border-2 border-neutral-200' },
  { name: 'Yellow', value: '#FEF3C7', swatch: 'bg-yellow-200' },
  { name: 'Green', value: '#D1FAE5', swatch: 'bg-emerald-200' },
  { name: 'Blue', value: '#DBEAFE', swatch: 'bg-sky-200' },
  { name: 'Pink', value: '#FCE7F3', swatch: 'bg-pink-200' },
  { name: 'Purple', value: '#EDE9FE', swatch: 'bg-violet-200' },
];

const FONT_FAMILIES = [
  { name: 'Serif', value: '"Lora", "Georgia", serif', preview: 'Aa' },
  { name: 'Sans', value: '"Inter", system-ui, sans-serif', preview: 'Aa' },
  { name: 'Mono', value: '"JetBrains Mono", monospace', preview: 'Aa' },
];

export const Write: React.FC = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [paperMode, setPaperMode] = useState<'clean' | 'paper' | 'ruled'>('paper');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // ---- Theme init ----
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    const savedFont = localStorage.getItem('write-font');
    if (savedFont) setFontFamily(savedFont);
    const savedPaper = localStorage.getItem('write-paper') as any;
    if (savedPaper) setPaperMode(savedPaper);
  }, []);

  // ---- Load edit or draft ----
  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const res = await api.get(`/stories/${editId}`);
          if (res.data.success) {
            const story = res.data.story;
            setTitle(story.title);
            setCategory(story.category);
            if (story.image?.url) setImagePreview(story.image.url);
            if (editorRef.current) {
              editorRef.current.innerHTML = story.story;
              updateCounts(story.story);
            }
          }
        } catch {
          toast.error('Could not load story');
          navigate('/stories');
        }
      })();
    } else {
      // Check for local draft
      const draft = localStorage.getItem('draft-new');
      if (draft) {
        try {
          const d = JSON.parse(draft);
          if (d.title || d.content) setHasDraft(true);
        } catch {}
      }
    }
  }, [editId]);

  const restoreDraft = () => {
    const draft = localStorage.getItem('draft-new');
    if (!draft) return;
    try {
      const d = JSON.parse(draft);
      setTitle(d.title || '');
      setCategory(d.category || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = d.content || '';
        updateCounts(d.content || '');
      }
      setHasDraft(false);
      toast.success('Draft restored');
    } catch {
      toast.error('Could not restore draft');
    }
  };

  const discardDraft = () => {
    localStorage.removeItem('draft-new');
    setHasDraft(false);
  };

  // ---- Close menus on outside click ----
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(target)) setShowCategoryMenu(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) setShowMoreMenu(false);
      if (colorRef.current && !colorRef.current.contains(target)) setShowColorPicker(false);
      if (highlightRef.current && !highlightRef.current.contains(target)) setShowHighlightPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ---- ESC exits focus mode ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocusMode]);

  const updateCounts = (html: string) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
    setReadTime(Math.max(1, Math.ceil(words / 200)));
  };

  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          `draft-${editId || 'new'}`,
          JSON.stringify({
            title,
            category,
            content: editorRef.current?.innerHTML || '',
            savedAt: Date.now(),
          })
        );
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, 800);
  }, [title, category, editId]);

  useEffect(() => {
    if (title || category) triggerAutoSave();
  }, [title, category, triggerAutoSave]);

  // ---- Selection save/restore (for pickers) ----
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0).cloneRange());
    }
  };
  const restoreSelection = () => {
    if (savedRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange);
    }
  };

  const execCmd = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    checkActiveFormats();
    triggerAutoSave();
  };

  const applyColor = (color: string) => {
    restoreSelection();
    if (color === 'inherit') {
      document.execCommand('removeFormat', false);
    } else {
      document.execCommand('foreColor', false, color);
    }
    setShowColorPicker(false);
    triggerAutoSave();
  };

  const applyHighlight = (color: string) => {
    restoreSelection();
    document.execCommand('hiliteColor', false, color);
    setShowHighlightPicker(false);
    triggerAutoSave();
  };

  const checkActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
    });
  };

  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setShowFloatingToolbar(false);
      return;
    }
    // Only show if selection is inside editor
    if (!editorRef.current?.contains(sel.anchorNode)) {
      setShowFloatingToolbar(false);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setShowFloatingToolbar(false);
      return;
    }
    const toolbarWidth = 320;
    let left = rect.left + rect.width / 2 + window.scrollX;
    left = Math.max(toolbarWidth / 2 + 16, Math.min(left, window.innerWidth - toolbarWidth / 2 - 16));
    setToolbarPos({
      top: rect.top + window.scrollY - 56,
      left,
    });
    setShowFloatingToolbar(true);
    checkActiveFormats();
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const openLinkInput = () => {
    saveSelection();
    setShowLinkInput(true);
    setTimeout(() => linkInputRef.current?.focus(), 50);
  };

  const applyLink = () => {
    if (!linkUrl.trim()) {
      setShowLinkInput(false);
      return;
    }
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    restoreSelection();
    document.execCommand('createLink', false, url);
    setLinkUrl('');
    setShowLinkInput(false);
    triggerAutoSave();
  };

  const insertDivider = () => {
    execCmd('insertHTML', '<hr class="editor-hr" />');
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Add a title first');
      titleRef.current?.focus();
      return;
    }
    if (!category) {
      toast.error('Pick a genre');
      setShowCategoryMenu(true);
      return;
    }
    const content = editorRef.current?.innerHTML || '';
    const stripped = content.replace(/<[^>]+>/g, '').trim();
    if (!stripped) {
      toast.error('Write something meaningful');
      editorRef.current?.focus();
      return;
    }

    setPublishing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + Math.floor(Math.random() * 12) + 3));
    }, 120);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('story', content);
      if (imageFile) formData.append('image', imageFile);

      const res = editId
        ? await api.put(`/stories/${editId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : await api.post('/stories', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

      if (res.data.success) {
        clearInterval(interval);
        setProgress(100);
        localStorage.removeItem(`draft-${editId || 'new'}`);
        setTimeout(() => {
          toast.success(editId ? 'Story updated' : 'Published');
          navigate('/stories');
        }, 700);
      }
    } catch (err: any) {
      clearInterval(interval);
      setPublishing(false);
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
  };

  const toggleTheme = () => {
    const dark = !isDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const changeFont = (val: string) => {
    setFontFamily(val);
    localStorage.setItem('write-font', val);
  };

  const changePaper = (val: 'clean' | 'paper' | 'ruled') => {
    setPaperMode(val);
    localStorage.setItem('write-paper', val);
  };

  const selectedCategory = CATEGORIES.find(c => c.value === category);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handlePublish();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFocusMode(f => !f);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openLinkInput();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [title, category]);

  // Paper background classes
  const paperBg =
    paperMode === 'paper'
      ? 'bg-[#FBF8F1] dark:bg-[#161513]'
      : paperMode === 'ruled'
      ? 'bg-[#FBFAF7] dark:bg-[#0F0F0F] editor-ruled'
      : 'bg-white dark:bg-[#0A0A0A]';

  return (
    <div
      className={`${paperBg} text-neutral-900 dark:text-neutral-100 min-h-screen transition-colors duration-500 selection:bg-amber-200/60 dark:selection:bg-amber-500/30`}
      style={{ fontFamily }}
    >
      {/* ============ PUBLISH OVERLAY ============ */}
      {publishing && (
        <div className="fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-[100] font-sans">
          {progress < 100 ? (
            <>
              <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-neutral-200 dark:border-neutral-800" />
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48" cy="48" r="46"
                    stroke="currentColor" strokeWidth="2" fill="none"
                    className="text-neutral-900 dark:text-white transition-all duration-200"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - progress / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-sm font-semibold tabular-nums">{progress}%</span>
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 mb-2">Publishing</p>
              <p className="text-sm text-neutral-400">Bringing your words to life…</p>
            </>
          ) : (
            <div className="text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                <i className="ri-check-line text-3xl text-white dark:text-neutral-900" />
              </div>
              <p className="text-2xl font-semibold">Published</p>
              <p className="text-sm text-neutral-500 mt-1">Your story is live</p>
            </div>
          )}
        </div>
      )}

      {/* ============ FLOATING SELECTION TOOLBAR ============ */}
      {showFloatingToolbar && !showLinkInput && (
        <div
          style={{ top: toolbarPos.top, left: toolbarPos.left, transform: 'translateX(-50%)' }}
          className="fixed z-40 bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl shadow-2xl px-1 py-1 flex items-center gap-0.5 font-sans animate-in fade-in slide-in-from-bottom-2 duration-150 ring-1 ring-white/10"
        >
          {[
            { cmd: 'bold', icon: 'ri-bold', label: 'Bold' },
            { cmd: 'italic', icon: 'ri-italic', label: 'Italic' },
            { cmd: 'underline', icon: 'ri-underline', label: 'Underline' },
            { cmd: 'strikeThrough', icon: 'ri-strikethrough', label: 'Strike' },
          ].map(b => (
            <button
              key={b.cmd}
              type="button"
              onMouseDown={e => { e.preventDefault(); execCmd(b.cmd); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                activeFormats[b.cmd] ? 'bg-white/20 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'
              }`}
              title={b.label}
            >
              <i className={`${b.icon} text-base`} />
            </button>
          ))}
          <div className="w-px h-5 bg-white/15 mx-1" />

          {/* Text color */}
          <div ref={colorRef} className="relative">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); saveSelection(); setShowColorPicker(v => !v); setShowHighlightPicker(false); }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-300 hover:bg-white/10 hover:text-white transition-all"
              title="Text color"
            >
              <i className="ri-font-color text-base" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-neutral-900 dark:bg-neutral-800 rounded-xl p-2 shadow-2xl ring-1 ring-white/10 flex gap-1 flex-wrap w-[180px] animate-in fade-in slide-in-from-top-1 duration-100">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); applyColor(c.value); }}
                    className={`w-7 h-7 rounded-md ${c.swatch} hover:scale-110 transition-transform ring-1 ring-white/10`}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight */}
          <div ref={highlightRef} className="relative">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); saveSelection(); setShowHighlightPicker(v => !v); setShowColorPicker(false); }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-300 hover:bg-white/10 hover:text-white transition-all"
              title="Highlight"
            >
              <i className="ri-mark-pen-line text-base" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-neutral-900 dark:bg-neutral-800 rounded-xl p-2 shadow-2xl ring-1 ring-white/10 flex gap-1 flex-wrap w-[160px] animate-in fade-in slide-in-from-top-1 duration-100">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); applyHighlight(c.value); }}
                    className={`w-7 h-7 rounded-md ${c.swatch} hover:scale-110 transition-transform`}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-white/15 mx-1" />
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<h2>'); }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-300 hover:bg-white/10 hover:text-white text-xs font-bold"
            title="Heading"
          >
            H
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<blockquote>'); }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-300 hover:bg-white/10 hover:text-white"
            title="Quote"
          >
            <i className="ri-double-quotes-l" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); openLinkInput(); }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-300 hover:bg-white/10 hover:text-white"
            title="Link (⌘K)"
          >
            <i className="ri-link" />
          </button>
        </div>
      )}

      {/* ============ LINK INPUT POPOVER ============ */}
      {showLinkInput && (
        <div
          style={{ top: toolbarPos.top, left: toolbarPos.left, transform: 'translateX(-50%)' }}
          className="fixed z-50 bg-neutral-900 dark:bg-neutral-800 rounded-xl shadow-2xl ring-1 ring-white/10 p-1.5 flex items-center gap-1 font-sans animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <i className="ri-link text-neutral-400 ml-2" />
          <input
            ref={linkInputRef}
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') applyLink();
              if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
            }}
            placeholder="Paste or type a link…"
            className="bg-transparent text-white text-sm outline-none w-64 px-2 py-1.5 placeholder-neutral-500"
          />
          <button
            type="button"
            onClick={applyLink}
            className="bg-white text-neutral-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100"
          >
            Add
          </button>
        </div>
      )}

      {/* ============ FOCUS MODE EXIT BUTTON (floating) ============ */}
      {isFocusMode && (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="fixed top-5 right-5 z-40 w-10 h-10 rounded-full bg-neutral-900/80 dark:bg-white/80 text-white dark:text-neutral-900 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-all shadow-lg font-sans animate-in fade-in duration-300"
          title="Exit focus mode (Esc)"
        >
          <i className="ri-fullscreen-exit-line text-lg" />
        </button>
      )}

      {/* ============ HEADER ============ */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-xl transition-all duration-500 ${
          isFocusMode
            ? 'opacity-0 -translate-y-full pointer-events-none'
            : 'bg-white/70 dark:bg-black/70 border-b border-neutral-200/60 dark:border-neutral-800/60'
        }`}
      >
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between font-sans">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
              title="Back"
            >
              <i className="ri-arrow-left-line text-lg" />
            </button>
            <div className="text-xs text-neutral-400 dark:text-neutral-600 hidden sm:flex items-center gap-2 min-w-0">
              <span className="truncate max-w-[120px]">{editId ? 'Editing' : 'Draft'}</span>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Saving…</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Saved</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <span className="opacity-0">·</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-neutral-400 dark:text-neutral-600 mr-2 hidden md:block tabular-nums">
              {wordCount} words · {readTime} min
            </span>

            {/* More menu */}
            <div ref={moreMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu(v => !v)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                title="Preferences"
              >
                <i className="ri-settings-3-line text-lg" />
              </button>
              {showMoreMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Font */}
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold px-1 mb-2">Font</p>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {FONT_FAMILIES.map(f => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => changeFont(f.value)}
                        className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                          fontFamily === f.value
                            ? 'bg-neutral-900 text-white border-transparent dark:bg-white dark:text-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                        }`}
                        style={{ fontFamily: f.value }}
                      >
                        <div className="text-base mb-0.5">{f.preview}</div>
                        <div className="text-[10px] opacity-70">{f.name}</div>
                      </button>
                    ))}
                  </div>

                  {/* Paper */}
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold px-1 mb-2">Paper</p>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      { val: 'clean', label: 'Clean' },
                      { val: 'paper', label: 'Paper' },
                      { val: 'ruled', label: 'Ruled' },
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => changePaper(p.val as any)}
                        className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                          paperMode === p.val
                            ? 'bg-neutral-900 text-white border-transparent dark:bg-white dark:text-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => { setIsFocusMode(true); setShowMoreMenu(false); }}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <span className="flex items-center gap-2">
                        <i className="ri-fullscreen-line" />
                        Focus mode
                      </span>
                      <kbd className="text-[10px] text-neutral-400 font-mono">⌘⇧F</kbd>
                    </button>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <span className="flex items-center gap-2">
                        <i className={isDark ? 'ri-sun-line' : 'ri-moon-line'} />
                        {isDark ? 'Light mode' : 'Dark mode'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePublish}
              className="ml-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2 rounded-full font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <main
        className={`max-w-3xl mx-auto px-5 md:px-8 pb-40 transition-all duration-500 ${
          isFocusMode ? 'pt-24 md:pt-32' : 'pt-10 md:pt-16'
        }`}
      >
        {/* Draft restore banner */}
        {hasDraft && !editId && (
          <div className="mb-6 flex items-center justify-between p-3 pl-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-900/30 font-sans animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5 text-sm">
              <i className="ri-history-line text-amber-600" />
              <span className="text-neutral-700 dark:text-neutral-300">You have an unsaved draft</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:opacity-90"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Meta row */}
        <div
          className={`flex flex-wrap items-center gap-2 mb-8 font-sans transition-all duration-500 ${
            isFocusMode ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'
          }`}
        >
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryMenu(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedCategory
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent'
                  : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-600'
              }`}
            >
              <i className={`${selectedCategory?.icon || 'ri-price-tag-3-line'} text-base`} />
              <span>{selectedCategory?.label || 'Add genre'}</span>
              {selectedCategory && <i className="ri-arrow-down-s-line text-base opacity-60" />}
            </button>

            {showCategoryMenu && (
              <div className="absolute top-full mt-2 left-0 min-w-[200px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => { setCategory(c.value); setShowCategoryMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                      category === c.value ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <i className={`${c.icon} text-base`} />
                    <span>{c.label}</span>
                    {category === c.value && <i className="ri-check-line ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!imagePreview && (
            <>
              <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" id="image-input" className="hidden" onChange={handleImageChange} />
              <label
                htmlFor="image-input"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer transition-all"
              >
                <i className="ri-image-add-line text-base" />
                <span>Cover</span>
              </label>
            </>
          )}
        </div>

        {imagePreview && (
          <div className={`relative mb-10 rounded-2xl overflow-hidden group bg-neutral-100 dark:bg-neutral-900 aspect-[16/9] transition-all duration-500 ${isFocusMode ? 'opacity-0 h-0 mb-0' : ''}`}>
            <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" id="image-input-change" className="hidden" onChange={handleImageChange} />
              <label htmlFor="image-input-change" className="bg-white/90 hover:bg-white text-neutral-900 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer backdrop-blur transition-all font-sans">Replace</label>
              <button type="button" onClick={handleRemoveImage} className="bg-white/90 hover:bg-red-500 hover:text-white text-neutral-900 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur transition-all">
                <i className="ri-delete-bin-line text-sm" />
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <textarea
          ref={titleRef}
          rows={1}
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-transparent text-4xl md:text-5xl leading-tight font-bold placeholder-neutral-300 dark:placeholder-neutral-700 border-none outline-none resize-none overflow-hidden mb-3 tracking-tight"
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = `${t.scrollHeight}px`;
          }}
        />

        {/* Byline meta (subtle) */}
        <div className={`flex items-center gap-3 text-xs text-neutral-400 mb-10 font-sans transition-opacity duration-300 ${isFocusMode ? 'opacity-0' : ''}`}>
          <span>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          {wordCount > 0 && (
            <>
              <span>·</span>
              <span className="tabular-nums">{readTime} min read</span>
            </>
          )}
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={e => {
            updateCounts((e.target as HTMLDivElement).innerHTML);
            triggerAutoSave();
          }}
          onKeyUp={checkActiveFormats}
          onMouseUp={checkActiveFormats}
          className="prose-editor w-full bg-transparent border-none outline-none min-h-[60vh] text-lg md:text-xl leading-[1.85] text-neutral-800 dark:text-neutral-200"
          data-placeholder="Tell your story…"
          spellCheck
        />
      </main>

      {/* ============ MOBILE BOTTOM BAR ============ */}
      <div
        className={`md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-neutral-200/60 dark:border-neutral-800/60 px-3 py-2 font-sans transition-all duration-500 ${
          isFocusMode ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {[
              { cmd: 'bold', icon: 'ri-bold' },
              { cmd: 'italic', icon: 'ri-italic' },
              { cmd: 'underline', icon: 'ri-underline' },
            ].map(b => (
              <button
                key={b.cmd}
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd(b.cmd); }}
                className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                  activeFormats[b.cmd]
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <i className={b.icon} />
              </button>
            ))}
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />
            <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<h2>'); }} className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-bold">H</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<blockquote>'); }} className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <i className="ri-double-quotes-l" />
            </button>
            <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <i className="ri-list-unordered" />
            </button>
            <button type="button" onMouseDown={e => { e.preventDefault(); openLinkInput(); }} className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <i className="ri-link" />
            </button>
            <button type="button" onMouseDown={e => { e.preventDefault(); insertDivider(); }} className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <i className="ri-separator" />
            </button>
          </div>
          <span className="text-[11px] text-neutral-400 tabular-nums pr-2 shrink-0">
            {wordCount}w
          </span>
        </div>
      </div>

      {/* ============ EDITOR STYLES ============ */}
      <style>{`
        .prose-editor:empty:before,
        .prose-editor:has(> br:only-child):before {
          content: attr(data-placeholder);
          color: rgb(212 212 212);
          pointer-events: none;
          font-style: italic;
        }
        .dark .prose-editor:empty:before,
        .dark .prose-editor:has(> br:only-child):before { color: rgb(64 64 64); }

        .prose-editor h1 {
          font-size: 2rem; font-weight: 700; margin: 2rem 0 1rem;
          line-height: 1.2; letter-spacing: -0.02em;
        }
        .prose-editor h2 {
          font-size: 1.5rem; font-weight: 700; margin: 1.75rem 0 0.75rem;
          line-height: 1.3; letter-spacing: -0.01em;
        }
        .prose-editor h3 {
          font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem;
        }
        .prose-editor p { margin: 0.75rem 0; }
        .prose-editor blockquote {
          border-left: 3px solid currentColor;
          padding-left: 1.25rem;
          margin: 1.75rem 0;
          font-style: italic;
          opacity: 0.85;
          font-size: 1.15em;
        }
        .prose-editor ul, .prose-editor ol {
          padding-left: 1.5rem; margin: 1rem 0;
        }
        .prose-editor ul { list-style: disc; }
        .prose-editor ol { list-style: decimal; }
        .prose-editor li { margin: 0.4rem 0; }
        .prose-editor a {
          color: inherit;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
          text-decoration-color: rgb(163 163 163);
        }
        .prose-editor a:hover { text-decoration-color: currentColor; }
        .prose-editor strong { font-weight: 700; }
        .prose-editor em { font-style: italic; }
        .prose-editor .editor-hr,
        .prose-editor hr {
          border: none;
          height: 1px;
          background: currentColor;
          opacity: 0.15;
          margin: 2.5rem auto;
          width: 60%;
        }

        /* Ruled paper */
        .editor-ruled .prose-editor {
          background-image: repeating-linear-gradient(
            transparent 0,
            transparent 2.7rem,
            rgba(0,0,0,0.06) 2.7rem,
            rgba(0,0,0,0.06) calc(2.7rem + 1px)
          );
          line-height: 2.7rem;
        }
        .dark .editor-ruled .prose-editor {
          background-image: repeating-linear-gradient(
            transparent 0,
            transparent 2.7rem,
            rgba(255,255,255,0.05) 2.7rem,
            rgba(255,255,255,0.05) calc(2.7rem + 1px)
          );
        }

        @keyframes animate-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: animate-in 0.15s ease-out; }
        .slide-in-from-bottom-2 { animation-name: animate-in; }
        .slide-in-from-top-1, .slide-in-from-top-2 {
          animation: fade-in-down 0.15s ease-out;
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};