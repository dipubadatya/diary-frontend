
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import api from '../../services/api';
// import toast from 'react-hot-toast';

// // ─── Genre options ───────────────────────────────────────────────────────────
// const CATEGORIES = [
//   { value: 'random-thoughts', label: 'Thought',   icon: 'ri-lightbulb-line'  },
//   { value: 'poetry',          label: 'Poetry',     icon: 'ri-quill-pen-line'  },
//   { value: 'fiction',         label: 'Fiction',    icon: 'ri-book-open-line'  },
//   { value: 'drama',           label: 'Adventure',  icon: 'ri-compass-3-line'  },
//   { value: 'mystery',         label: 'Mystery',    icon: 'ri-search-eye-line' },
//   { value: 'fantasy',         label: 'Fantasy',    icon: 'ri-magic-line'      },
//   { value: 'other',           label: 'Other',      icon: 'ri-more-line'       },
// ];

// // ─── Colour palettes ─────────────────────────────────────────────────────────
// const TEXT_COLORS = [
//   { name: 'Default', value: 'inherit', swatch: '#1a1a1a' },
//   { name: 'Sepia',   value: '#8B4513', swatch: '#8B4513' },
//   { name: 'Crimson', value: '#DC2626', swatch: '#DC2626' },
//   { name: 'Amber',   value: '#D97706', swatch: '#D97706' },
//   { name: 'Forest',  value: '#059669', swatch: '#059669' },
//   { name: 'Ocean',   value: '#0284C7', swatch: '#0284C7' },
//   { name: 'Violet',  value: '#7C3AED', swatch: '#7C3AED' },
// ];

// const HIGHLIGHT_COLORS = [
//   { name: 'None',   value: 'transparent', swatch: '#ffffff', border: true },
//   { name: 'Yellow', value: '#FEF3C7',     swatch: '#FEF3C7' },
//   { name: 'Green',  value: '#D1FAE5',     swatch: '#D1FAE5' },
//   { name: 'Blue',   value: '#DBEAFE',     swatch: '#DBEAFE' },
//   { name: 'Pink',   value: '#FCE7F3',     swatch: '#FCE7F3' },
//   { name: 'Purple', value: '#EDE9FE',     swatch: '#EDE9FE' },
// ];

// // ─── Font choices ─────────────────────────────────────────────────────────────
// const FONT_FAMILIES = [
//   { name: 'Serif', value: '"Lora", "Georgia", serif',       preview: 'Aa' },
//   { name: 'Sans',  value: '"Inter", system-ui, sans-serif', preview: 'Aa' },
//   { name: 'Mono',  value: '"JetBrains Mono", monospace',    preview: 'Aa' },
// ];

// // ─── Design tokens ───────────────────────────────────────────────────────────
// const LIME = '#D9F26B';
// const INK  = '#0A0A0A';

// // ─── Validation error type ───────────────────────────────────────────────────
// type ValidationError = {
//   field: 'title' | 'category' | 'content' | 'image' | 'api';
//   message: string;
// } | null;

// export const Write: React.FC = () => {
//   const [searchParams] = useSearchParams();
//   const editId   = searchParams.get('edit');
//   const navigate = useNavigate();

//   // Content
//   const [title,        setTitle]        = useState('');
//   const [category,     setCategory]     = useState('');
//   const [imageFile,    setImageFile]    = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);

//   // Publishing
//   const [publishing, setPublishing] = useState(false);
//   const [progress,   setProgress]   = useState(0);

//   // Saving
//   const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
//   const [hasDraft,   setHasDraft]   = useState(false);

//   // Validation — inline error instead of toast
//   const [validationError, setValidationError] = useState<ValidationError>(null);

//   // UI modes
//   const [isFocusMode, setIsFocusMode] = useState(false);

//   // Menus
//   const [showCategoryMenu,    setShowCategoryMenu]    = useState(false);
//   const [showSettingsMenu,    setShowSettingsMenu]    = useState(false);
//   const [showColorPicker,     setShowColorPicker]     = useState(false);
//   const [showHighlightPicker, setShowHighlightPicker] = useState(false);

//   // Floating toolbar
//   const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
//   const [toolbarPos,          setToolbarPos]          = useState({ top: 0, left: 0 });
//   const [activeFormats,       setActiveFormats]       = useState<Record<string, boolean>>({});

//   // Link input
//   const [showLinkInput, setShowLinkInput] = useState(false);
//   const [linkUrl,       setLinkUrl]       = useState('');
//   const [savedRange,    setSavedRange]    = useState<Range | null>(null);
//   const [isEditingLink, setIsEditingLink] = useState(false);
//   const [activeLinkEl,  setActiveLinkEl]  = useState<HTMLAnchorElement | null>(null);

//   // Preferences
//   const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
//   const [paperMode,  setPaperMode]  = useState<'clean' | 'paper' | 'ruled'>('paper');

//   // Stats
//   const [wordCount, setWordCount] = useState(0);
//   const [readTime,  setReadTime]  = useState(0);

//   // Refs
//   const editorRef     = useRef<HTMLDivElement>(null);
//   const titleRef      = useRef<HTMLTextAreaElement>(null);
//   const categoryRef   = useRef<HTMLDivElement>(null);
//   const settingsRef   = useRef<HTMLDivElement>(null);
//   const colorRef      = useRef<HTMLDivElement>(null);
//   const highlightRef  = useRef<HTMLDivElement>(null);
//   const linkInputRef  = useRef<HTMLInputElement>(null);
//   const toolbarRef    = useRef<HTMLDivElement>(null);
//   const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const positionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // Touch detection
//   const isTouchDevice = useRef(false);
//   useEffect(() => {
//     isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
//   }, []);

//   // ─── Restore preferences ─────────────────────────────────────────────────
//   useEffect(() => {
//     const savedFont  = localStorage.getItem('write-font');
//     const savedPaper = localStorage.getItem('write-paper') as 'clean' | 'paper' | 'ruled' | null;
//     if (savedFont)  setFontFamily(savedFont);
//     if (savedPaper) setPaperMode(savedPaper);
//   }, []);

//   // ─── Load story for editing or check for draft ────────────────────────────
//   useEffect(() => {
//     if (editId) {
//       (async () => {
//         try {
//           const res = await api.get(`/stories/${editId}`);
//           if (res.data.success) {
//             const s = res.data.story;
//             setTitle(s.title);
//             setCategory(s.category);
//             if (s.image?.url) setImagePreview(s.image.url);
//             if (editorRef.current) {
//               editorRef.current.innerHTML = s.story;
//               updateCounts(s.story);
//             }
//           }
//         } catch {
//           setValidationError({ field: 'api', message: 'Could not load your story. Please go back and try again.' });
//         }
//       })();
//     } else {
//       const raw = localStorage.getItem('draft-new');
//       if (raw) {
//         try {
//           const d = JSON.parse(raw);
//           if (d.title || d.content) setHasDraft(true);
//         } catch { /* ignore malformed */ }
//       }
//     }
//   }, [editId]);

//   // ─── Close dropdowns on outside click ─────────────────────────────────────
//   useEffect(() => {
//     const handler = (e: MouseEvent | TouchEvent) => {
//       const t = e.target as Node;
//       if (categoryRef.current  && !categoryRef.current.contains(t))  setShowCategoryMenu(false);
//       if (settingsRef.current  && !settingsRef.current.contains(t))  setShowSettingsMenu(false);
//       if (colorRef.current     && !colorRef.current.contains(t))     setShowColorPicker(false);
//       if (highlightRef.current && !highlightRef.current.contains(t)) setShowHighlightPicker(false);
//     };
//     document.addEventListener('mousedown', handler);
//     document.addEventListener('touchstart', handler, { passive: true });
//     return () => {
//       document.removeEventListener('mousedown', handler);
//       document.removeEventListener('touchstart', handler);
//     };
//   }, []);

//   // ─── ESC exits focus mode ─────────────────────────────────────────────────
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') {
//         if (showLinkInput) { setShowLinkInput(false); setLinkUrl(''); return; }
//         if (isFocusMode) setIsFocusMode(false);
//       }
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, [isFocusMode, showLinkInput]);

//   // ─── Keyboard shortcuts ───────────────────────────────────────────────────
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       const mod = e.metaKey || e.ctrlKey;
//       if (mod && e.key === 's')                             { e.preventDefault(); handlePublish(); }
//       if (mod && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); setIsFocusMode(f => !f); }
//       if (mod && e.key === 'k')                             { e.preventDefault(); openLinkInput(); }
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, [title, category]);

//   // ─── Word count / read time ───────────────────────────────────────────────
//   const updateCounts = (html: string) => {
//     const text  = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
//     const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
//     setWordCount(words);
//     setReadTime(Math.max(1, Math.ceil(words / 200)));
//   };

//   // ─── Auto-save ────────────────────────────────────────────────────────────
//   const triggerAutoSave = useCallback(() => {
//     setSaveStatus('saving');
//     if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
//     autoSaveTimer.current = setTimeout(() => {
//       try {
//         localStorage.setItem(
//           `draft-${editId || 'new'}`,
//           JSON.stringify({
//             title,
//             category,
//             content: editorRef.current?.innerHTML || '',
//             savedAt: Date.now(),
//           })
//         );
//         setSaveStatus('saved');
//         setTimeout(() => setSaveStatus('idle'), 2000);
//       } catch {
//         setSaveStatus('idle');
//       }
//     }, 800);
//   }, [title, category, editId]);

//   useEffect(() => {
//     if (title || category) triggerAutoSave();
//   }, [title, category, triggerAutoSave]);

//   // ─── Draft helpers ────────────────────────────────────────────────────────
//   const restoreDraft = () => {
//     const raw = localStorage.getItem('draft-new');
//     if (!raw) return;
//     try {
//       const d = JSON.parse(raw);
//       setTitle(d.title || '');
//       setCategory(d.category || '');
//       if (editorRef.current) {
//         editorRef.current.innerHTML = d.content || '';
//         updateCounts(d.content || '');
//       }
//       setHasDraft(false);
//       toast.success('Draft restored');
//     } catch {
//       setValidationError({ field: 'api', message: 'Could not restore your draft. It may be corrupted.' });
//     }
//   };

//   const discardDraft = () => {
//     localStorage.removeItem('draft-new');
//     setHasDraft(false);
//   };

//   // ─── Selection save / restore ─────────────────────────────────────────────
//   const saveSelection = () => {
//     const sel = window.getSelection();
//     if (sel && sel.rangeCount > 0) setSavedRange(sel.getRangeAt(0).cloneRange());
//   };

//   const restoreSelection = () => {
//     if (!savedRange) return;
//     const sel = window.getSelection();
//     sel?.removeAllRanges();
//     sel?.addRange(savedRange);
//   };

//   // ─── Format command wrapper ───────────────────────────────────────────────
//   const execCmd = (cmd: string, val = '') => {
//     editorRef.current?.focus();
//     document.execCommand(cmd, false, val || undefined);
//     checkActiveFormats();
//     triggerAutoSave();
//   };

//   const applyColor = (color: string) => {
//     restoreSelection();
//     if (color === 'inherit') document.execCommand('removeFormat', false);
//     else document.execCommand('foreColor', false, color);
//     setShowColorPicker(false);
//     checkActiveFormats();
//     triggerAutoSave();
//   };

//   const applyHighlight = (color: string) => {
//     restoreSelection();
//     document.execCommand('hiliteColor', false, color);
//     setShowHighlightPicker(false);
//     triggerAutoSave();
//   };

//   const checkActiveFormats = () => {
//     setActiveFormats({
//       bold:          document.queryCommandState('bold'),
//       italic:        document.queryCommandState('italic'),
//       underline:     document.queryCommandState('underline'),
//       strikethrough: document.queryCommandState('strikeThrough'),
//     });
//   };

//   // ─── Link detection — check if caret is inside an <a> tag ─────────────────
//   const findParentLink = (node: Node | null): HTMLAnchorElement | null => {
//     while (node && node !== editorRef.current) {
//       if (node.nodeType === 1 && (node as Element).tagName === 'A') return node as HTMLAnchorElement;
//       node = node.parentNode;
//     }
//     return null;
//   };

//   // ─── Floating toolbar positioning ─────────────────────────────────────────
//   const positionToolbar = useCallback(() => {
//     if (positionTimer.current) clearTimeout(positionTimer.current);

//     positionTimer.current = setTimeout(() => {
//       const sel = window.getSelection();

//       if (!sel || sel.rangeCount === 0) {
//         setShowFloatingToolbar(false);
//         setActiveLinkEl(null);
//         return;
//       }

//       // Check if caret is inside a link (for showing unlink option)
//       const linkEl = findParentLink(sel.anchorNode);
//       setActiveLinkEl(linkEl);

//       if (sel.isCollapsed && !linkEl) {
//         setShowFloatingToolbar(false);
//         return;
//       }

//       // Only handle inside editor
//       if (!editorRef.current?.contains(sel.anchorNode)) {
//         setShowFloatingToolbar(false);
//         return;
//       }

//       const range = sel.getRangeAt(0);
//       const rect  = range.getBoundingClientRect();

//       // If caret is inside a link but no text selected, use the link element's rect
//       const targetRect = (sel.isCollapsed && linkEl) ? linkEl.getBoundingClientRect() : rect;

//       if (targetRect.width === 0 && targetRect.height === 0) {
//         setShowFloatingToolbar(false);
//         return;
//       }

//       const viewW   = window.innerWidth;
//       const TOOLBAR = 360;
//       const GAP     = 10;

//       // Horizontal: centre over selection, clamp to viewport
//       const centerX  = targetRect.left + targetRect.width / 2;
//       const clampedX = Math.max(TOOLBAR / 2 + GAP, Math.min(centerX, viewW - TOOLBAR / 2 - GAP));

//       // Vertical: above if room, below otherwise
//       let topY = targetRect.top - 52;
//       if (topY < GAP) topY = targetRect.bottom + GAP;

//       setToolbarPos({ top: topY, left: clampedX });
//       setShowFloatingToolbar(true);
//       checkActiveFormats();
//     }, 16);
//   }, []);

//   // Desktop mouseup
//   useEffect(() => {
//     const handler = () => positionToolbar();
//     document.addEventListener('mouseup', handler);
//     return () => document.removeEventListener('mouseup', handler);
//   }, [positionToolbar]);

//   // Mobile touchend on editor
//   useEffect(() => {
//     const el = editorRef.current;
//     if (!el) return;
//     const handler = () => positionToolbar();
//     el.addEventListener('touchend', handler, { passive: true });
//     return () => el.removeEventListener('touchend', handler);
//   }, [positionToolbar]);

//   // selectionchange — hide when collapsed, reposition when adjusting handles
//   useEffect(() => {
//     const handler = () => {
//       const sel = window.getSelection();
//       if (!sel || sel.rangeCount === 0) {
//         if (positionTimer.current) clearTimeout(positionTimer.current);
//         setShowFloatingToolbar(false);
//         setActiveLinkEl(null);
//         return;
//       }
//       // Check for link even when collapsed
//       const linkEl = findParentLink(sel.anchorNode);
//       if (sel.isCollapsed && !linkEl) {
//         if (positionTimer.current) clearTimeout(positionTimer.current);
//         setShowFloatingToolbar(false);
//         setActiveLinkEl(null);
//         return;
//       }
//       positionToolbar();
//     };
//     document.addEventListener('selectionchange', handler);
//     return () => document.removeEventListener('selectionchange', handler);
//   }, [positionToolbar]);

//   // Keyboard selection (shift+arrows)
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.shiftKey && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
//         positionToolbar();
//       }
//     };
//     document.addEventListener('keyup', handler);
//     return () => document.removeEventListener('keyup', handler);
//   }, [positionToolbar]);

//   // Cleanup
//   useEffect(() => {
//     return () => { if (positionTimer.current) clearTimeout(positionTimer.current); };
//   }, []);

//   // ─── Image handling ───────────────────────────────────────────────────────
//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (file.size > 5 * 1024 * 1024) {
//       setValidationError({ field: 'image', message: 'Cover image must be under 5 MB. Try compressing it first.' });
//       return;
//     }
//     const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
//     if (!validTypes.includes(file.type)) {
//       setValidationError({ field: 'image', message: 'Only JPG, PNG, and WebP formats are supported.' });
//       return;
//     }
//     setValidationError(null);
//     setImageFile(file);
//     setImagePreview(URL.createObjectURL(file));
//   };

//   const handleRemoveImage = () => {
//     setImageFile(null);
//     setImagePreview(null);
//   };

//   // ─── Link insertion & unlinking ────────────────────────────────────────────
//   const openLinkInput = () => {
//     saveSelection();
//     // If caret is inside an existing link, pre-fill the URL
//     if (activeLinkEl) {
//       setLinkUrl(activeLinkEl.href);
//       setIsEditingLink(true);
//     } else {
//       setLinkUrl('');
//       setIsEditingLink(false);
//     }
//     setShowFloatingToolbar(false);
//     setShowLinkInput(true);
//     setTimeout(() => linkInputRef.current?.focus(), 80);
//   };

//   const applyLink = () => {
//     const trimmed = linkUrl.trim();
//     if (!trimmed) {
//       setShowLinkInput(false);
//       setLinkUrl('');
//       return;
//     }
//     const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
//     restoreSelection();
//     if (isEditingLink && activeLinkEl) {
//       activeLinkEl.href = url;
//     } else {
//       document.execCommand('createLink', false, url);
//     }
//     setLinkUrl('');
//     setShowLinkInput(false);
//     setIsEditingLink(false);
//     triggerAutoSave();
//   };

//   const unlinkSelection = () => {
//     if (activeLinkEl) {
//       // Replace link with its text content
//       const text = document.createTextNode(activeLinkEl.textContent || '');
//       activeLinkEl.parentNode?.replaceChild(text, activeLinkEl);
//       setActiveLinkEl(null);
//     } else {
//       restoreSelection();
//       document.execCommand('unlink', false);
//     }
//     setShowFloatingToolbar(false);
//     setShowLinkInput(false);
//     triggerAutoSave();
//   };

//   const insertDivider = () => execCmd('insertHTML', '<hr class="editor-hr" />');

//   // ─── Clear validation error when user fixes the issue ─────────────────────
//   useEffect(() => {
//     if (validationError?.field === 'title' && title.trim()) setValidationError(null);
//   }, [title, validationError]);

//   useEffect(() => {
//     if (validationError?.field === 'category' && category) setValidationError(null);
//   }, [category, validationError]);

//   // ─── Publish with inline validation ───────────────────────────────────────
//   const handlePublish = async () => {
//     // Step-by-step validation — show inline error for the first missing thing
//     if (!title.trim()) {
//       setValidationError({ field: 'title', message: 'Every story needs a title. What would you call this one?' });
//       titleRef.current?.focus();
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//       return;
//     }

//     if (!category) {
//       setValidationError({ field: 'category', message: 'Choose a genre so readers can find your story.' });
//       setShowCategoryMenu(true);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//       return;
//     }

//     const content  = editorRef.current?.innerHTML || '';
//     const stripped = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
//     if (!stripped || stripped.length < 10) {
//       setValidationError({ field: 'content', message: 'Your story seems a bit short. Write a few more lines before publishing.' });
//       editorRef.current?.focus();
//       return;
//     }

//     setValidationError(null);
//     setPublishing(true);
//     setProgress(0);

//     const interval = setInterval(() => {
//       setProgress(p => (p >= 90 ? 90 : p + Math.floor(Math.random() * 10) + 4));
//     }, 130);

//     try {
//       const form = new FormData();
//       form.append('title',    title);
//       form.append('category', category);
//       form.append('story',    content);
//       if (imageFile) form.append('image', imageFile);

//       const headers = { 'Content-Type': 'multipart/form-data' };
//       const res = editId
//         ? await api.put(`/stories/${editId}`, form, { headers })
//         : await api.post('/stories',          form, { headers });

//       if (res.data.success) {
//         clearInterval(interval);
//         setProgress(100);
//         localStorage.removeItem(`draft-${editId || 'new'}`);
//         setTimeout(() => navigate('/stories'), 900);
//       }
//     } catch (err: any) {
//       clearInterval(interval);
//       setPublishing(false);
//       setProgress(0);
//       const msg = err.response?.data?.error || err.message || 'Something went wrong';
//       setValidationError({ field: 'api', message: msg });
//     }
//   };

//   // ─── Preferences ─────────────────────────────────────────────────────────
//   const changeFont = (val: string) => {
//     setFontFamily(val);
//     localStorage.setItem('write-font', val);
//   };

//   const changePaper = (val: 'clean' | 'paper' | 'ruled') => {
//     setPaperMode(val);
//     localStorage.setItem('write-paper', val);
//   };

//   const selectedCategory = CATEGORIES.find(c => c.value === category);

//   const paperBg =
//     paperMode === 'paper' ? 'bg-[#FBF8F1]' :
//     paperMode === 'ruled' ? 'bg-[#FBFAF7] editor-ruled' :
//     'bg-white';

//   // ─── Validation error icon per field ──────────────────────────────────────
//   const errorIcon = (field: string) => {
//     switch (field) {
//       case 'title':    return 'ri-heading';
//       case 'category': return 'ri-price-tag-3-line';
//       case 'content':  return 'ri-file-text-line';
//       case 'image':    return 'ri-image-line';
//       default:         return 'ri-error-warning-line';
//     }
//   };

//   return (
//     <div
//       className={`${paperBg} text-stone-900 min-h-screen transition-colors duration-300 selection:bg-[#D9F26B]/50`}
//       style={{ fontFamily }}
//     >

//       {/* ═══════════ PUBLISH OVERLAY ═══════════ */}
//       {publishing && (
//         <div className="fixed inset-0 bg-white/97 backdrop-blur-xl flex flex-col items-center justify-center z-[100] font-sans px-6">
//           {progress < 100 ? (
//             <>
//               <div className="relative w-20 h-20 flex items-center justify-center mb-8">
//                 <div className="absolute inset-0 rounded-full border-2 border-stone-100" />
//                 <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
//                   <circle
//                     cx="40" cy="40" r="37"
//                     stroke={LIME}
//                     strokeWidth="3"
//                     fill="none"
//                     strokeDasharray={2 * Math.PI * 37}
//                     strokeDashoffset={2 * Math.PI * 37 * (1 - progress / 100)}
//                     strokeLinecap="round"
//                     className="transition-all duration-200"
//                   />
//                 </svg>
//                 <span className="text-sm font-semibold tabular-nums">{progress}%</span>
//               </div>
//               <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 mb-1">
//                 {editId ? 'Updating' : 'Publishing'}
//               </p>
//               <p className="text-sm text-stone-400">Bringing your words to life…</p>
//             </>
//           ) : (
//             <div className="text-center">
//               <div
//                 className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
//                 style={{ backgroundColor: LIME }}
//               >
//                 <i className="ri-check-line text-2xl" style={{ color: INK }} />
//               </div>
//               <p className="text-xl font-bold">{editId ? 'Updated!' : 'Published!'}</p>
//               <p className="text-sm text-stone-400 mt-1">Your story is live</p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ═══════════ FLOATING TOOLBAR ═══════════ */}
//       {showFloatingToolbar && !showLinkInput && (
//         <div
//           ref={toolbarRef}
//           style={{
//             position:  'fixed',
//             top:       toolbarPos.top,
//             left:      toolbarPos.left,
//             transform: 'translateX(-50%)',
//             zIndex:    50,
//           }}
//           className="bg-stone-900 text-white rounded-2xl shadow-2xl px-1.5 py-1.5 flex items-center gap-0.5 font-sans ring-1 ring-white/10 max-w-[calc(100vw-24px)]"
//           onMouseDown={e => e.preventDefault()}
//           onTouchStart={e => e.preventDefault()}
//         >
//           {/* Format buttons */}
//           {[
//             { cmd: 'bold',          icon: 'ri-bold',          key: 'bold'          },
//             { cmd: 'italic',        icon: 'ri-italic',        key: 'italic'        },
//             { cmd: 'underline',     icon: 'ri-underline',     key: 'underline'     },
//             { cmd: 'strikeThrough', icon: 'ri-strikethrough', key: 'strikethrough' },
//           ].map(b => (
//             <button
//               key={b.cmd}
//               type="button"
//               onMouseDown={e => { e.preventDefault(); execCmd(b.cmd); }}
//               onTouchEnd={e =>   { e.preventDefault(); execCmd(b.cmd); }}
//               className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors text-sm ${
//                 activeFormats[b.key] ? 'bg-white/20 text-white' : 'text-stone-400 hover:bg-white/10 hover:text-white'
//               }`}
//             >
//               <i className={b.icon} />
//             </button>
//           ))}

//           <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

//           {/* Heading + Quote */}
//           <button
//             type="button"
//             onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<h2>'); }}
//             onTouchEnd={e =>   { e.preventDefault(); execCmd('formatBlock', '<h2>'); }}
//             className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white text-[11px] font-bold"
//           >
//             H2
//           </button>
//           <button
//             type="button"
//             onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<blockquote>'); }}
//             onTouchEnd={e =>   { e.preventDefault(); execCmd('formatBlock', '<blockquote>'); }}
//             className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white text-sm"
//           >
//             <i className="ri-double-quotes-l" />
//           </button>

//           <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

//           {/* Text colour */}
//           <div ref={colorRef} className="relative">
//             <button
//               type="button"
//               onMouseDown={e => { e.preventDefault(); saveSelection(); setShowColorPicker(v => !v); setShowHighlightPicker(false); }}
//               onTouchEnd={e =>   { e.preventDefault(); saveSelection(); setShowColorPicker(v => !v); setShowHighlightPicker(false); }}
//               className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white text-sm"
//             >
//               <i className="ri-font-color" />
//             </button>
//             {showColorPicker && (
//               <div
//                 className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-stone-900 rounded-xl p-2 shadow-2xl ring-1 ring-white/10 flex gap-1.5 flex-wrap w-44 z-10"
//                 onMouseDown={e => e.preventDefault()}
//                 onTouchStart={e => e.preventDefault()}
//               >
//                 {TEXT_COLORS.map(c => (
//                   <button
//                     key={c.value}
//                     type="button"
//                     onMouseDown={e => { e.preventDefault(); applyColor(c.value); }}
//                     onTouchEnd={e =>   { e.preventDefault(); applyColor(c.value); }}
//                     className="w-7 h-7 rounded-lg hover:scale-110 active:scale-95 transition-transform ring-1 ring-white/10 shrink-0"
//                     style={{ backgroundColor: c.swatch }}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Highlight */}
//           <div ref={highlightRef} className="relative">
//             <button
//               type="button"
//               onMouseDown={e => { e.preventDefault(); saveSelection(); setShowHighlightPicker(v => !v); setShowColorPicker(false); }}
//               onTouchEnd={e =>   { e.preventDefault(); saveSelection(); setShowHighlightPicker(v => !v); setShowColorPicker(false); }}
//               className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white text-sm"
//             >
//               <i className="ri-mark-pen-line" />
//             </button>
//             {showHighlightPicker && (
//               <div
//                 className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-stone-900 rounded-xl p-2 shadow-2xl ring-1 ring-white/10 flex gap-1.5 flex-wrap w-40 z-10"
//                 onMouseDown={e => e.preventDefault()}
//                 onTouchStart={e => e.preventDefault()}
//               >
//                 {HIGHLIGHT_COLORS.map(c => (
//                   <button
//                     key={c.value}
//                     type="button"
//                     onMouseDown={e => { e.preventDefault(); applyHighlight(c.value); }}
//                     onTouchEnd={e =>   { e.preventDefault(); applyHighlight(c.value); }}
//                     className="w-7 h-7 rounded-lg hover:scale-110 active:scale-95 transition-transform shrink-0"
//                     style={{
//                       backgroundColor: c.swatch,
//                       border: c.border ? '2px solid #e5e7eb' : '1px solid rgba(255,255,255,0.1)',
//                     }}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

//           {/* Link / Unlink */}
//           {activeLinkEl ? (
//             <>
//               <button
//                 type="button"
//                 onMouseDown={e => { e.preventDefault(); openLinkInput(); }}
//                 onTouchEnd={e =>   { e.preventDefault(); openLinkInput(); }}
//                 className="w-8 h-8 rounded-xl flex items-center justify-center text-sky-400 hover:bg-white/10 text-sm"
//                 title="Edit link"
//               >
//                 <i className="ri-pencil-line" />
//               </button>
//               <button
//                 type="button"
//                 onMouseDown={e => { e.preventDefault(); unlinkSelection(); }}
//                 onTouchEnd={e =>   { e.preventDefault(); unlinkSelection(); }}
//                 className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 hover:bg-white/10 text-sm"
//                 title="Remove link"
//               >
//                 <i className="ri-link-unlink" />
//               </button>
//             </>
//           ) : (
//             <button
//               type="button"
//               onMouseDown={e => { e.preventDefault(); openLinkInput(); }}
//               onTouchEnd={e =>   { e.preventDefault(); openLinkInput(); }}
//               className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white text-sm"
//               title="Add link"
//             >
//               <i className="ri-link" />
//             </button>
//           )}
//         </div>
//       )}

//       {/* ═══════════ LINK INPUT — centred overlay ═══════════ */}
//       {showLinkInput && (
//         <>
//           {/* Backdrop for mobile — tap outside to close */}
//           <div
//             className="fixed inset-0 z-[55]"
//             onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
//             onTouchEnd={() => { setShowLinkInput(false); setLinkUrl(''); }}
//           />

//           <div
//             className="fixed z-[60] font-sans"
//             style={{
//               // On desktop: float near selection. On mobile: centred near bottom above keyboard
//               top:       isTouchDevice.current ? 'auto' : toolbarPos.top,
//               bottom:    isTouchDevice.current ? '100px' : 'auto',
//               left:      '50%',
//               transform: 'translateX(-50%)',
//               width:     'calc(100% - 32px)',
//               maxWidth:  '380px',
//             }}
//           >
//             <div
//               className="bg-stone-900 rounded-2xl shadow-2xl ring-1 ring-white/10 p-2 flex items-center gap-2"
//               onMouseDown={e => e.preventDefault()}
//               onTouchStart={e => e.preventDefault()}
//             >
//               <i className="ri-link text-stone-500 ml-2 text-sm shrink-0" />

//               <input
//                 ref={linkInputRef}
//                 type="url"
//                 value={linkUrl}
//                 onChange={e => setLinkUrl(e.target.value)}
//                 onKeyDown={e => {
//                   if (e.key === 'Enter')  { e.preventDefault(); applyLink(); }
//                   if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
//                 }}
//                 placeholder="Paste or type a link…"
//                 className="bg-transparent text-white text-sm outline-none flex-1 min-w-0 px-1 py-2 placeholder-stone-500"
//                 autoComplete="url"
//               />

//               {/* Unlink button — only when editing an existing link */}
//               {isEditingLink && (
//                 <button
//                   type="button"
//                   onClick={unlinkSelection}
//                   className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 hover:bg-white/10 transition-colors shrink-0"
//                   title="Remove link"
//                 >
//                   <i className="ri-link-unlink text-sm" />
//                 </button>
//               )}

//               {/* Apply */}
//               <button
//                 type="button"
//                 onClick={applyLink}
//                 className="h-8 px-3 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
//                 style={{ backgroundColor: LIME, color: INK }}
//               >
//                 {isEditingLink ? 'Save' : 'Add'}
//               </button>

//               {/* Close */}
//               <button
//                 type="button"
//                 onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
//                 className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-500 hover:bg-white/10 hover:text-white transition-colors shrink-0"
//               >
//                 <i className="ri-close-line text-sm" />
//               </button>
//             </div>
//           </div>
//         </>
//       )}

//       {/* ═══════════ FOCUS MODE EXIT ═══════════ */}
//       {isFocusMode && (
//         <button
//           type="button"
//           onClick={() => setIsFocusMode(false)}
//           className="fixed top-4 right-4 z-40 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-stone-900/80 text-white backdrop-blur-md hover:bg-stone-900 transition-all shadow-lg font-sans text-xs font-semibold"
//         >
//           <i className="ri-fullscreen-exit-line text-sm" />
//           <span className="hidden sm:inline">Exit focus</span>
//         </button>
//       )}

//       {/* ═══════════ HEADER — floating pill nav ═══════════ */}
//       <header
//         className={`sticky top-0 z-30 transition-all duration-300 ${
//           isFocusMode ? 'opacity-0 -translate-y-full pointer-events-none' : ''
//         }`}
//       >
//         <div className="px-3 sm:px-5 py-3">
//           <div
//             className="max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-full px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between font-sans"
//             style={{ boxShadow: '0 2px 16px -4px rgba(15,23,42,0.08)' }}
//           >
//             {/* Left: back + status */}
//             <div className="flex items-center gap-2 sm:gap-3 min-w-0">
//               <button
//                 type="button"
//                 onClick={() => navigate(-1)}
//                 className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all shrink-0"
//               >
//                 <i className="ri-arrow-left-line text-base" />
//               </button>
//               <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400">
//                 <span>{editId ? 'Editing' : 'New story'}</span>
//                 <span>·</span>
//                 {saveStatus === 'saving' && (
//                   <span className="flex items-center gap-1.5 text-amber-500">
//                     <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
//                     Saving…
//                   </span>
//                 )}
//                 {saveStatus === 'saved' && (
//                   <span className="flex items-center gap-1.5 text-emerald-600">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                     Saved
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Right: stats + settings + publish */}
//             <div className="flex items-center gap-1">
//               <span className="hidden md:block text-xs text-stone-400 tabular-nums mr-2">
//                 {wordCount} words · {readTime} min read
//               </span>

//               {/* Settings */}
//               <div ref={settingsRef} className="relative">
//                 <button
//                   type="button"
//                   onClick={() => setShowSettingsMenu(v => !v)}
//                   className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all"
//                 >
//                   <i className="ri-settings-3-line text-base" />
//                 </button>

//                 {showSettingsMenu && (
//                   <div
//                     className="absolute top-full right-0 mt-2 w-56 sm:w-60 bg-white border border-stone-100 rounded-2xl shadow-xl p-3 z-30"
//                     style={{ boxShadow: '0 8px 32px -8px rgba(15,23,42,0.14)' }}
//                   >
//                     <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold px-1 mb-2">Font</p>
//                     <div className="grid grid-cols-3 gap-1.5 mb-3">
//                       {FONT_FAMILIES.map(f => (
//                         <button
//                           key={f.value}
//                           type="button"
//                           onClick={() => changeFont(f.value)}
//                           className={`py-2 rounded-xl text-[11px] font-medium transition-all border ${
//                             fontFamily === f.value
//                               ? 'bg-stone-900 text-white border-transparent'
//                               : 'border-stone-200 text-stone-500 hover:border-stone-400'
//                           }`}
//                           style={{ fontFamily: f.value }}
//                         >
//                           <div className="text-sm mb-0.5">{f.preview}</div>
//                           <div className="text-[10px] opacity-70">{f.name}</div>
//                         </button>
//                       ))}
//                     </div>

//                     <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold px-1 mb-2">Paper</p>
//                     <div className="grid grid-cols-3 gap-1.5 mb-3">
//                       {(['clean', 'paper', 'ruled'] as const).map(p => (
//                         <button
//                           key={p}
//                           type="button"
//                           onClick={() => changePaper(p)}
//                           className={`py-2 rounded-xl text-[11px] font-medium transition-all border capitalize ${
//                             paperMode === p
//                               ? 'bg-stone-900 text-white border-transparent'
//                               : 'border-stone-200 text-stone-500 hover:border-stone-400'
//                           }`}
//                         >
//                           {p}
//                         </button>
//                       ))}
//                     </div>

//                     <div className="border-t border-stone-100 pt-2">
//                       <button
//                         type="button"
//                         onClick={() => { setIsFocusMode(true); setShowSettingsMenu(false); }}
//                         className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-stone-50 text-stone-700 transition-colors"
//                       >
//                         <span className="flex items-center gap-2 text-xs">
//                           <i className="ri-fullscreen-line" />
//                           Focus mode
//                         </span>
//                         <kbd className="text-[10px] text-stone-400 font-mono bg-stone-100 px-1.5 py-0.5 rounded hidden sm:block">⌘⇧F</kbd>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Publish CTA */}
//               <button
//                 type="button"
//                 onClick={handlePublish}
//                 className="ml-1 inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all active:scale-95 group"
//                 style={{ backgroundColor: LIME, color: INK }}
//                 onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c8e254')}
//                 onMouseLeave={e => (e.currentTarget.style.backgroundColor = LIME)}
//               >
//                 {editId ? 'Update' : 'Publish'}
//                 <span
//                   className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] group-hover:rotate-45 transition-transform"
//                   style={{ backgroundColor: INK, color: '#fff' }}
//                 >
//                   <i className="ri-arrow-right-up-line text-[10px]" />
//                 </span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* ═══════════ MAIN WRITING AREA ═══════════ */}
//       <main
//         className={`max-w-2xl mx-auto px-4 sm:px-6 md:px-8 pb-32 sm:pb-40 transition-all duration-300 ${
//           isFocusMode ? 'pt-16 sm:pt-20 md:pt-28' : 'pt-4 sm:pt-6 md:pt-10'
//         }`}
//       >
//         {/* ── Inline validation error banner ── */}
//         {validationError && (
//           <div
//             className="mb-5 flex items-start gap-3 p-4 rounded-2xl border font-sans"
//             style={{
//               backgroundColor: validationError.field === 'api' ? '#FEF2F2' : '#FFFBEB',
//               borderColor:     validationError.field === 'api' ? '#FECACA' : '#FDE68A',
//             }}
//           >
//             <div
//               className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
//               style={{
//                 backgroundColor: validationError.field === 'api' ? '#FEE2E2' : '#FEF3C7',
//               }}
//             >
//               <i
//                 className={`${errorIcon(validationError.field)} text-sm`}
//                 style={{
//                   color: validationError.field === 'api' ? '#DC2626' : '#D97706',
//                 }}
//               />
//             </div>
//             <div className="flex-1 min-w-0">
//               <p
//                 className="text-[13px] font-semibold leading-relaxed"
//                 style={{
//                   color: validationError.field === 'api' ? '#991B1B' : '#92400E',
//                 }}
//               >
//                 {validationError.message}
//               </p>
//               {validationError.field === 'title' && (
//                 <button
//                   type="button"
//                   onClick={() => { setValidationError(null); titleRef.current?.focus(); }}
//                   className="text-[11px] font-bold text-sky-600 hover:text-sky-800 mt-1.5 transition-colors"
//                 >
//                   Go to title →
//                 </button>
//               )}
//               {validationError.field === 'category' && (
//                 <button
//                   type="button"
//                   onClick={() => { setValidationError(null); setShowCategoryMenu(true); }}
//                   className="text-[11px] font-bold text-sky-600 hover:text-sky-800 mt-1.5 transition-colors"
//                 >
//                   Choose genre →
//                 </button>
//               )}
//               {validationError.field === 'content' && (
//                 <button
//                   type="button"
//                   onClick={() => { setValidationError(null); editorRef.current?.focus(); }}
//                   className="text-[11px] font-bold text-sky-600 hover:text-sky-800 mt-1.5 transition-colors"
//                 >
//                   Back to writing →
//                 </button>
//               )}
//               {validationError.field === 'api' && (
//                 <button
//                   type="button"
//                   onClick={handlePublish}
//                   className="text-[11px] font-bold text-red-700 hover:text-red-900 mt-1.5 transition-colors underline underline-offset-2"
//                 >
//                   Retry publishing →
//                 </button>
//               )}
//             </div>
//             <button
//               type="button"
//               onClick={() => setValidationError(null)}
//               className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors"
//               style={{
//                 color: validationError.field === 'api' ? '#DC2626' : '#D97706',
//               }}
//             >
//               <i className="ri-close-line text-sm" />
//             </button>
//           </div>
//         )}

//         {/* ── Draft restore banner ── */}
//         {hasDraft && !editId && (
//           <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200/70 font-sans">
//             <div className="flex items-center gap-2.5">
//               <i className="ri-history-line text-amber-600 text-base" />
//               <span className="text-stone-700 text-xs font-medium">You have an unsaved draft</span>
//             </div>
//             <div className="flex gap-1.5">
//               <button
//                 type="button"
//                 onClick={restoreDraft}
//                 className="px-3 py-1.5 rounded-full text-[11px] font-bold hover:opacity-80 transition-opacity"
//                 style={{ backgroundColor: LIME, color: INK }}
//               >
//                 Restore
//               </button>
//               <button
//                 type="button"
//                 onClick={discardDraft}
//                 className="px-3 py-1.5 rounded-full text-[11px] font-bold text-stone-500 hover:bg-stone-100 transition-colors"
//               >
//                 Discard
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ── Genre + cover row ── */}
//         <div
//           className={`flex flex-wrap items-center gap-2 mb-6 sm:mb-7 font-sans transition-all duration-300 ${
//             isFocusMode ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'
//           }`}
//         >
//           {/* Genre picker */}
//           <div ref={categoryRef} className="relative">
//             <button
//               type="button"
//               onClick={() => setShowCategoryMenu(v => !v)}
//               className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${
//                 validationError?.field === 'category'
//                   ? 'border-amber-400 text-amber-700 bg-amber-50'
//                   : selectedCategory
//                     ? 'bg-stone-900 text-white border-transparent'
//                     : 'border-stone-200 text-stone-400 hover:border-stone-400'
//               }`}
//             >
//               <i className={`${selectedCategory?.icon || 'ri-price-tag-3-line'} text-sm`} />
//               <span>{selectedCategory?.label || 'Genre'}</span>
//               <i className="ri-arrow-down-s-line text-sm opacity-60" />
//             </button>

//             {showCategoryMenu && (
//               <div
//                 className="absolute top-full mt-2 left-0 min-w-[180px] bg-white border border-stone-100 rounded-2xl shadow-xl py-1.5 z-20"
//                 style={{ boxShadow: '0 8px 32px -8px rgba(15,23,42,0.14)' }}
//               >
//                 {CATEGORIES.map(c => (
//                   <button
//                     key={c.value}
//                     type="button"
//                     onClick={() => { setCategory(c.value); setShowCategoryMenu(false); }}
//                     className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-stone-50 transition-colors ${
//                       category === c.value ? 'text-stone-900 font-bold' : 'text-stone-500'
//                     }`}
//                   >
//                     <i className={`${c.icon} text-sm`} />
//                     <span>{c.label}</span>
//                     {category === c.value && <i className="ri-check-line ml-auto text-stone-900" />}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Cover upload */}
//           {!imagePreview && (
//             <>
//               <input
//                 type="file"
//                 accept="image/jpeg,image/png,image/webp"
//                 id="cover-input"
//                 className="hidden"
//                 onChange={handleImageChange}
//               />
//               <label
//                 htmlFor="cover-input"
//                 className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide text-stone-400 border border-stone-200 hover:border-stone-400 cursor-pointer transition-all"
//               >
//                 <i className="ri-image-add-line text-sm" />
//                 Cover
//               </label>
//             </>
//           )}
//         </div>

//         {/* ── Cover image preview ── */}
//         {imagePreview && (
//           <div
//             className={`relative mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl overflow-hidden group bg-stone-100 transition-all duration-300 ${
//               isFocusMode ? 'opacity-0 h-0 mb-0' : ''
//             }`}
//             style={{ aspectRatio: '16/9' }}
//           >
//             <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//             <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity font-sans">
//               <input
//                 type="file"
//                 accept="image/jpeg,image/png,image/webp"
//                 id="cover-input-replace"
//                 className="hidden"
//                 onChange={handleImageChange}
//               />
//               <label
//                 htmlFor="cover-input-replace"
//                 className="bg-white/90 hover:bg-white text-stone-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold cursor-pointer backdrop-blur transition-all"
//               >
//                 Replace
//               </label>
//               <button
//                 type="button"
//                 onClick={handleRemoveImage}
//                 className="bg-white/90 hover:bg-red-500 hover:text-white text-stone-900 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center backdrop-blur transition-all"
//               >
//                 <i className="ri-delete-bin-line text-sm" />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ── Title ── */}
//         <textarea
//           ref={titleRef}
//           rows={1}
//           placeholder="Your title…"
//           value={title}
//           onChange={e => {
//             setTitle(e.target.value);
//             const t = e.target;
//             t.style.height = 'auto';
//             t.style.height = `${t.scrollHeight}px`;
//           }}
//           className={`w-full bg-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight border-none outline-none resize-none overflow-hidden mb-2 tracking-tight transition-colors ${
//             validationError?.field === 'title'
//               ? 'placeholder-amber-400'
//               : 'placeholder-stone-300'
//           }`}
//           style={{ fontFamily }}
//         />

//         {/* ── Meta line ── */}
//         <div
//           className={`flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-stone-400 mb-8 sm:mb-10 font-sans transition-opacity duration-300 ${
//             isFocusMode ? 'opacity-0' : ''
//           }`}
//         >
//           <span>
//             {new Date().toLocaleDateString(undefined, {
//               month: 'long', day: 'numeric', year: 'numeric',
//             })}
//           </span>
//           {wordCount > 0 && (
//             <>
//               <span>·</span>
//               <span className="tabular-nums">{readTime} min read</span>
//               <span className="hidden sm:inline">·</span>
//               <span className="hidden sm:inline tabular-nums">{wordCount} words</span>
//             </>
//           )}
//         </div>

//         {/* ── Editor ── */}
//         <div
//           ref={editorRef}
//           contentEditable
//           suppressContentEditableWarning
//           onInput={e => {
//             const html = (e.target as HTMLDivElement).innerHTML;
//             updateCounts(html);
//             triggerAutoSave();
//             // Clear content error when user types enough
//             if (validationError?.field === 'content') {
//               const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
//               if (text.length >= 10) setValidationError(null);
//             }
//           }}
//           onKeyUp={checkActiveFormats}
//           className={`prose-editor w-full bg-transparent border-none outline-none min-h-[50vh] sm:min-h-[60vh] text-base sm:text-lg md:text-xl leading-[1.85] sm:leading-[1.9] text-stone-800 ${
//             validationError?.field === 'content' ? 'prose-editor-highlight' : ''
//           }`}
//           data-placeholder="Tell your story…"
//           spellCheck
//           style={{ fontFamily }}
//         />
//       </main>

//       {/* ═══════════ MOBILE BOTTOM BAR — floating pill ═══════════ */}
//       <div
//         className={`md:hidden fixed bottom-4 left-3 right-3 z-30 font-sans transition-all duration-300 ${
//           isFocusMode ? 'translate-y-24 opacity-0 pointer-events-none' : ''
//         }`}
//       >
//         <div
//           className="bg-white/95 backdrop-blur-md rounded-full px-2 py-1.5 flex items-center justify-between"
//           style={{ boxShadow: '0 4px 24px -6px rgba(15,23,42,0.16)' }}
//           onTouchStart={e => e.preventDefault()}
//           onMouseDown={e => e.preventDefault()}
//         >
//           <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
//             {[
//               { cmd: 'bold',      icon: 'ri-bold',      key: 'bold'      },
//               { cmd: 'italic',    icon: 'ri-italic',    key: 'italic'    },
//               { cmd: 'underline', icon: 'ri-underline', key: 'underline' },
//             ].map(b => (
//               <button
//                 key={b.cmd}
//                 type="button"
//                 onTouchEnd={e =>  { e.preventDefault(); execCmd(b.cmd); }}
//                 onMouseDown={e => { e.preventDefault(); execCmd(b.cmd); }}
//                 className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors text-sm ${
//                   activeFormats[b.key] ? 'bg-stone-900 text-white' : 'text-stone-400 active:bg-stone-100'
//                 }`}
//               >
//                 <i className={b.icon} />
//               </button>
//             ))}

//             <div className="w-px h-4 bg-stone-200 mx-1 shrink-0" />

//             <button
//               type="button"
//               onTouchEnd={e =>  { e.preventDefault(); execCmd('formatBlock', '<h2>'); }}
//               onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<h2>'); }}
//               className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-stone-400 active:bg-stone-100 text-[10px] font-bold"
//             >
//               H2
//             </button>
//             <button
//               type="button"
//               onTouchEnd={e =>  { e.preventDefault(); execCmd('formatBlock', '<blockquote>'); }}
//               onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<blockquote>'); }}
//               className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-stone-400 active:bg-stone-100 text-sm"
//             >
//               <i className="ri-double-quotes-l" />
//             </button>
//             <button
//               type="button"
//               onTouchEnd={e =>  { e.preventDefault(); execCmd('insertUnorderedList'); }}
//               onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}
//               className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-stone-400 active:bg-stone-100 text-sm"
//             >
//               <i className="ri-list-unordered" />
//             </button>
//             <button
//               type="button"
//               onTouchEnd={e =>  { e.preventDefault(); openLinkInput(); }}
//               onMouseDown={e => { e.preventDefault(); openLinkInput(); }}
//               className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-stone-400 active:bg-stone-100 text-sm"
//             >
//               <i className="ri-link" />
//             </button>
//             <button
//               type="button"
//               onTouchEnd={e =>  { e.preventDefault(); insertDivider(); }}
//               onMouseDown={e => { e.preventDefault(); insertDivider(); }}
//               className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-stone-400 active:bg-stone-100 text-sm"
//             >
//               <i className="ri-separator" />
//             </button>
//           </div>

//           <span
//             className="shrink-0 ml-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
//             style={{ backgroundColor: LIME, color: INK }}
//           >
//             {wordCount}w
//           </span>
//         </div>
//       </div>

//       {/* ═══════════ EDITOR STYLES ═══════════ */}
//       <style>{`
//         /* Placeholder */
//         .prose-editor:empty::before,
//         .prose-editor:has(> br:only-child)::before {
//           content: attr(data-placeholder);
//           color: #d6d3d1;
//           pointer-events: none;
//           font-style: italic;
//         }

//         /* Subtle highlight when content field has error */
//         .prose-editor-highlight {
//           box-shadow: inset 0 0 0 2px rgba(217, 119, 6, 0.15);
//           border-radius: 12px;
//           padding: 4px;
//         }

//         /* Headings */
//         .prose-editor h1 { font-size: 1.75rem; font-weight: 700; margin: 2rem 0 1rem; line-height: 1.2; letter-spacing: -0.02em; }
//         .prose-editor h2 { font-size: 1.4rem; font-weight: 700; margin: 1.75rem 0 0.75rem; line-height: 1.3; letter-spacing: -0.01em; }
//         .prose-editor h3 { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 0.5rem; line-height: 1.4; }
//         @media (min-width: 640px) {
//           .prose-editor h1 { font-size: 1.875rem; }
//           .prose-editor h2 { font-size: 1.5rem; }
//           .prose-editor h3 { font-size: 1.25rem; }
//         }

//         /* Paragraphs */
//         .prose-editor p { margin: 0.65rem 0; }

//         /* Blockquote */
//         .prose-editor blockquote {
//           border-left: 3px solid ${LIME};
//           padding-left: 1rem;
//           margin: 1.75rem 0;
//           font-style: italic;
//           color: #57534e;
//           font-size: 1.05em;
//           line-height: 1.8;
//         }
//         @media (min-width: 640px) {
//           .prose-editor blockquote { padding-left: 1.25rem; font-size: 1.1em; }
//         }

//         /* Lists */
//         .prose-editor ul, .prose-editor ol { padding-left: 1.25rem; margin: 0.75rem 0; }
//         @media (min-width: 640px) {
//           .prose-editor ul, .prose-editor ol { padding-left: 1.5rem; }
//         }
//         .prose-editor ul { list-style: disc; }
//         .prose-editor ol { list-style: decimal; }
//         .prose-editor li { margin: 0.35rem 0; }

//         /* Links inside editor */
//         .prose-editor a {
//           color: #0284c7;
//           text-decoration: underline;
//           text-decoration-thickness: 1px;
//           text-underline-offset: 3px;
//           cursor: pointer;
//           transition: color 0.15s;
//         }
//         .prose-editor a:hover { color: #0369a1; }

//         /* Inline */
//         .prose-editor strong { font-weight: 700; }
//         .prose-editor em { font-style: italic; }

//         /* Divider */
//         .prose-editor hr,
//         .prose-editor .editor-hr {
//           border: none;
//           height: 1px;
//           background: #e7e5e4;
//           margin: 2rem auto;
//           width: 50%;
//         }
//         @media (min-width: 640px) {
//           .prose-editor hr, .prose-editor .editor-hr { margin: 2.5rem auto; }
//         }

//         /* Ruled paper */
//         .editor-ruled .prose-editor {
//           background-image: repeating-linear-gradient(
//             transparent 0,
//             transparent calc(1.85em - 1px),
//             rgba(0,0,0,0.04) calc(1.85em - 1px),
//             rgba(0,0,0,0.04) 1.85em
//           );
//         }

//         /* No scrollbar on mobile bar */
//         .no-scrollbar::-webkit-scrollbar { display: none; }
//         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

//         /* Disable blue tap highlight on all buttons */
//         button, label { -webkit-tap-highlight-color: transparent; }
//       `}</style>
//     </div>
//   );
// };

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ─── Genre options ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'random-thoughts', label: 'Thought', icon: 'ri-lightbulb-line' },
  { value: 'poetry', label: 'Poetry', icon: 'ri-quill-pen-line' },
  { value: 'fiction', label: 'Fiction', icon: 'ri-book-open-line' },
  { value: 'drama', label: 'Adventure', icon: 'ri-compass-3-line' },
  { value: 'mystery', label: 'Mystery', icon: 'ri-search-eye-line' },
  { value: 'fantasy', label: 'Fantasy', icon: 'ri-magic-line' },
  { value: 'other', label: 'Other', icon: 'ri-more-line' },
];

// ─── Colour palettes ─────────────────────────────────────────────────────────
const TEXT_COLORS = [
  { name: 'Default', value: 'inherit', swatch: '#141413' },
  { name: 'Sepia', value: '#7C4A21', swatch: '#7C4A21' },
  { name: 'Crimson', value: '#B91C1C', swatch: '#B91C1C' },
  { name: 'Amber', value: '#B45309', swatch: '#B45309' },
  { name: 'Forest', value: '#047857', swatch: '#047857' },
  { name: 'Ocean', value: '#0369A1', swatch: '#0369A1' },
  { name: 'Violet', value: '#6D28D9', swatch: '#6D28D9' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent', swatch: '#ffffff', border: true },
  { name: 'Warm', value: '#FEF3C7', swatch: '#FEF3C7' },
  { name: 'Sage', value: '#D1FAE5', swatch: '#D1FAE5' },
  { name: 'Sky', value: '#DBEAFE', swatch: '#DBEAFE' },
  { name: 'Rose', value: '#FCE7F3', swatch: '#FCE7F3' },
  { name: 'Lilac', value: '#EDE9FE', swatch: '#EDE9FE' },
];

// ─── Font choices ─────────────────────────────────────────────────────────────
const FONT_FAMILIES = [
  { name: 'Serif', value: '"Lora", "Georgia", serif', preview: 'Aa', desc: 'Classic literary' },
  { name: 'Sans', value: '"Inter", system-ui, sans-serif', preview: 'Aa', desc: 'Clean modern' },
  { name: 'Mono', value: '"JetBrains Mono", monospace', preview: 'Aa', desc: 'Typewriter draft' },
];

// ─── Validation error type ───────────────────────────────────────────────────
type ValidationError = {
  field: 'title' | 'category' | 'content' | 'image' | 'api';
  message: string;
} | null;

export const Write: React.FC = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  // Content
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Publishing
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Saving
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasDraft, setHasDraft] = useState(false);

  // Validation
  const [validationError, setValidationError] = useState<ValidationError>(null);

  // UI modes
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Menus
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // Floating toolbar
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Link input
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [activeLinkEl, setActiveLinkEl] = useState<HTMLAnchorElement | null>(null);

  // Preferences
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [paperMode, setPaperMode] = useState<'clean' | 'paper' | 'ruled'>('paper');

  // Stats
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch detection
  const isTouchDevice = useRef(false);
  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Auto-resize title textarea whenever title changes
  const syncTitleHeight = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    syncTitleHeight();
  }, [title, fontFamily, syncTitleHeight]);

  // ─── Restore preferences ─────────────────────────────────────────────────
  useEffect(() => {
    const savedFont = localStorage.getItem('write-font');
    const savedPaper = localStorage.getItem('write-paper') as 'clean' | 'paper' | 'ruled' | null;
    if (savedFont) setFontFamily(savedFont);
    if (savedPaper) setPaperMode(savedPaper);
  }, []);

  // ─── Load story for editing or check for draft ────────────────────────────
  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const res = await api.get(`/stories/${editId}`);
          if (res.data.success) {
            const s = res.data.story;
            setTitle(s.title);
            setCategory(s.category);
            if (s.image?.url) setImagePreview(s.image.url);
            if (editorRef.current) {
              editorRef.current.innerHTML = s.story;
              updateCounts(s.story);
            }
          }
        } catch {
          setValidationError({
            field: 'api',
            message: 'Could not load your story. Please go back and try again.',
          });
        }
      })();
    } else {
      const raw = localStorage.getItem('draft-new');
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d.title || d.content) setHasDraft(true);
        } catch {
          /* ignore malformed */
        }
      }
    }
  }, [editId]);

  // ─── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(t)) setShowCategoryMenu(false);
      if (settingsRef.current && !settingsRef.current.contains(t)) setShowSettingsMenu(false);
      if (colorRef.current && !colorRef.current.contains(t)) setShowColorPicker(false);
      if (highlightRef.current && !highlightRef.current.contains(t)) setShowHighlightPicker(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // ─── ESC exits focus mode or link modal ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLinkInput) {
          setShowLinkInput(false);
          setLinkUrl('');
          return;
        }
        if (isFocusMode) setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocusMode, showLinkInput]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlePublish();
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFocusMode(f => !f);
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openLinkInput();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [title, category]);

  // ─── Word count / read time ───────────────────────────────────────────────
  const updateCounts = (html: string) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
    setReadTime(words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0);
  };

  // ─── Auto-save ────────────────────────────────────────────────────────────
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
        setTimeout(() => setSaveStatus('idle'), 2200);
      } catch {
        setSaveStatus('idle');
      }
    }, 800);
  }, [title, category, editId]);

  useEffect(() => {
    if (title || category) triggerAutoSave();
  }, [title, category, triggerAutoSave]);

  // ─── Draft helpers ────────────────────────────────────────────────────────
  const restoreDraft = () => {
    const raw = localStorage.getItem('draft-new');
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      setTitle(d.title || '');
      setCategory(d.category || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = d.content || '';
        updateCounts(d.content || '');
      }
      setHasDraft(false);
      toast.success('Draft restored');
    } catch {
      setValidationError({
        field: 'api',
        message: 'Could not restore your draft. It may be corrupted.',
      });
    }
  };

  const discardDraft = () => {
    localStorage.removeItem('draft-new');
    setHasDraft(false);
  };

  // ─── Selection save / restore ─────────────────────────────────────────────
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) setSavedRange(sel.getRangeAt(0).cloneRange());
  };

  const restoreSelection = () => {
    if (!savedRange) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange);
  };

  // ─── Detect current block tag inside editor ───────────────────────────────
  const getCurrentBlockTag = (): string => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return '';
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1) {
        const tag = (node as Element).tagName.toUpperCase();
        if (['H1', 'H2', 'H3', 'BLOCKQUOTE', 'P', 'LI'].includes(tag)) {
          return tag;
        }
      }
      node = node.parentNode;
    }
    return '';
  };

  // ─── Format command wrapper (with smart block toggling) ──────────────────
  const execCmd = (cmd: string, val = '') => {
    editorRef.current?.focus();
    if (cmd === 'formatBlock') {
      const targetTag = val.replace(/[<>]/g, '').toUpperCase();
      const currentTag = getCurrentBlockTag();
      if (currentTag === targetTag) {
        document.execCommand('formatBlock', false, '<p>');
      } else {
        document.execCommand('formatBlock', false, val);
      }
    } else {
      document.execCommand(cmd, false, val || undefined);
    }
    checkActiveFormats();
    if (editorRef.current) updateCounts(editorRef.current.innerHTML);
    triggerAutoSave();
  };

  const applyColor = (color: string) => {
    restoreSelection();
    if (color === 'inherit') document.execCommand('removeFormat', false);
    else document.execCommand('foreColor', false, color);
    setShowColorPicker(false);
    checkActiveFormats();
    triggerAutoSave();
  };

  const applyHighlight = (color: string) => {
    restoreSelection();
    document.execCommand('hiliteColor', false, color);
    setShowHighlightPicker(false);
    triggerAutoSave();
  };

  const checkActiveFormats = () => {
    const blockTag = getCurrentBlockTag();
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
      h2: blockTag === 'H2',
      h3: blockTag === 'H3',
      blockquote: blockTag === 'BLOCKQUOTE',
    });
  };

  // ─── Link detection — check if caret is inside an <a> tag ─────────────────
  const findParentLink = (node: Node | null): HTMLAnchorElement | null => {
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1 && (node as Element).tagName === 'A')
        return node as HTMLAnchorElement;
      node = node.parentNode;
    }
    return null;
  };

  // ─── Floating toolbar positioning ─────────────────────────────────────────
  const positionToolbar = useCallback(() => {
    if (positionTimer.current) clearTimeout(positionTimer.current);

    positionTimer.current = setTimeout(() => {
      const sel = window.getSelection();

      if (!sel || sel.rangeCount === 0) {
        setShowFloatingToolbar(false);
        setActiveLinkEl(null);
        return;
      }

      if (!editorRef.current?.contains(sel.anchorNode)) {
        setShowFloatingToolbar(false);
        return;
      }

      const linkEl = findParentLink(sel.anchorNode);
      setActiveLinkEl(linkEl);
      checkActiveFormats();

      if (sel.isCollapsed && !linkEl) {
        setShowFloatingToolbar(false);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const targetRect =
        sel.isCollapsed && linkEl ? linkEl.getBoundingClientRect() : rect;

      if (targetRect.width === 0 && targetRect.height === 0) {
        setShowFloatingToolbar(false);
        return;
      }

      const viewW = window.innerWidth;
      const TOOLBAR = 340;
      const GAP = 12;

      const centerX = targetRect.left + targetRect.width / 2;
      const clampedX = Math.max(
        TOOLBAR / 2 + GAP,
        Math.min(centerX, viewW - TOOLBAR / 2 - GAP)
      );

      let topY = targetRect.top - 50;
      if (topY < 70) topY = targetRect.bottom + GAP;

      setToolbarPos({ top: topY, left: clampedX });
      setShowFloatingToolbar(true);
    }, 16);
  }, []);

  useEffect(() => {
    const handler = () => positionToolbar();
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [positionToolbar]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const handler = () => positionToolbar();
    el.addEventListener('touchend', handler, { passive: true });
    return () => el.removeEventListener('touchend', handler);
  }, [positionToolbar]);

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        if (positionTimer.current) clearTimeout(positionTimer.current);
        setShowFloatingToolbar(false);
        setActiveLinkEl(null);
        return;
      }
      const linkEl = findParentLink(sel.anchorNode);
      if (sel.isCollapsed && !linkEl) {
        if (positionTimer.current) clearTimeout(positionTimer.current);
        setShowFloatingToolbar(false);
        setActiveLinkEl(null);
        checkActiveFormats();
        return;
      }
      positionToolbar();
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [positionToolbar]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.shiftKey &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        positionToolbar();
      }
    };
    document.addEventListener('keyup', handler);
    return () => document.removeEventListener('keyup', handler);
  }, [positionToolbar]);

  useEffect(() => {
    return () => {
      if (positionTimer.current) clearTimeout(positionTimer.current);
    };
  }, []);

  // ─── Image handling (File input + Drag & Drop) ───────────────────────────
  const validateAndSetImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setValidationError({
        field: 'image',
        message: 'Cover image must be under 5 MB. Try compressing it first.',
      });
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setValidationError({
        field: 'image',
        message: 'Only JPG, PNG, and WebP formats are supported.',
      });
      return;
    }
    setValidationError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ─── Link insertion & unlinking ────────────────────────────────────────────
  const openLinkInput = () => {
    saveSelection();
    if (activeLinkEl) {
      setLinkUrl(activeLinkEl.href);
      setIsEditingLink(true);
    } else {
      setLinkUrl('');
      setIsEditingLink(false);
    }
    setShowFloatingToolbar(false);
    setShowLinkInput(true);
    setTimeout(() => linkInputRef.current?.focus(), 60);
  };

  const applyLink = () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      setShowLinkInput(false);
      setLinkUrl('');
      return;
    }
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    restoreSelection();
    editorRef.current?.focus();
    if (isEditingLink && activeLinkEl) {
      activeLinkEl.href = url;
    } else {
      document.execCommand('createLink', false, url);
    }
    setLinkUrl('');
    setShowLinkInput(false);
    setIsEditingLink(false);
    triggerAutoSave();
  };

  const unlinkSelection = () => {
    if (activeLinkEl) {
      const text = document.createTextNode(activeLinkEl.textContent || '');
      activeLinkEl.parentNode?.replaceChild(text, activeLinkEl);
      setActiveLinkEl(null);
    } else {
      restoreSelection();
      document.execCommand('unlink', false);
    }
    setShowFloatingToolbar(false);
    setShowLinkInput(false);
    triggerAutoSave();
  };

  const insertDivider = () => execCmd('insertHTML', '<hr class="editor-hr" /><p><br></p>');

  // ─── Clear validation error when user fixes the issue ─────────────────────
  useEffect(() => {
    if (validationError?.field === 'title' && title.trim()) setValidationError(null);
  }, [title, validationError]);

  useEffect(() => {
    if (validationError?.field === 'category' && category) setValidationError(null);
  }, [category, validationError]);

  // ─── Publish with inline validation ───────────────────────────────────────
  const handlePublish = async () => {
    if (!title.trim()) {
      setValidationError({
        field: 'title',
        message: 'Every story needs a title. What would you call this one?',
      });
      titleRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!category) {
      setValidationError({
        field: 'category',
        message: 'Choose a genre so readers can discover your story.',
      });
      setShowCategoryMenu(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const content = editorRef.current?.innerHTML || '';
    const stripped = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
    if (!stripped || stripped.length < 10) {
      setValidationError({
        field: 'content',
        message: 'Your story seems a bit short. Write a few more lines before publishing.',
      });
      editorRef.current?.focus();
      return;
    }

    setValidationError(null);
    setPublishing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + Math.floor(Math.random() * 10) + 4));
    }, 130);

    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('category', category);
      form.append('story', content);
      if (imageFile) form.append('image', imageFile);

      const headers = { 'Content-Type': 'multipart/form-data' };
      const res = editId
        ? await api.put(`/stories/${editId}`, form, { headers })
        : await api.post('/stories', form, { headers });

      if (res.data.success) {
        clearInterval(interval);
        setProgress(100);
        localStorage.removeItem(`draft-${editId || 'new'}`);
        setTimeout(() => navigate('/stories'), 850);
      }
    } catch (err: any) {
      clearInterval(interval);
      setPublishing(false);
      setProgress(0);
      const msg = err.response?.data?.error || err.message || 'Something went wrong';
      setValidationError({ field: 'api', message: msg });
    }
  };

  // ─── Preferences ─────────────────────────────────────────────────────────
  const changeFont = (val: string) => {
    setFontFamily(val);
    localStorage.setItem('write-font', val);
  };

  const changePaper = (val: 'clean' | 'paper' | 'ruled') => {
    setPaperMode(val);
    localStorage.setItem('write-paper', val);
  };

  const selectedCategory = CATEGORIES.find(c => c.value === category);

  const paperSurface =
    paperMode === 'paper'
      ? 'bg-[#FAF7F2]'
      : paperMode === 'ruled'
        ? 'bg-[#F8F5EE] editor-ruled'
        : 'bg-white';

  const errorIcon = (field: string) => {
    switch (field) {
      case 'title': return 'ri-heading';
      case 'category': return 'ri-price-tag-3-line';
      case 'content': return 'ri-file-text-line';
      case 'image': return 'ri-image-line';
      default: return 'ri-error-warning-line';
    }
  };

  return (
    <div
      className={`${paperSurface} text-[#141413] min-h-screen transition-colors duration-300 selection:bg-stone-900/12`}
      style={{ fontFamily }}
    >
      {/* ═══════════ PUBLISH OVERLAY ═══════════ */}
      {publishing && (
        <div className="fixed inset-0 bg-[#FAF7F2]/95 backdrop-blur-md flex flex-col items-center justify-center z-[100] font-sans px-6">
          {progress < 100 ? (
            <div className="text-center max-w-xs w-full">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-stone-200" />
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="29"
                    stroke="#141413"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 29}
                    strokeDashoffset={2 * Math.PI * 29 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                </svg>
                <span className="text-xs font-bold tabular-nums text-stone-900">
                  {progress}%
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-900 mb-1">
                {editId ? 'Saving changes…' : 'Publishing your story…'}
              </p>
              <p className="text-xs text-stone-500">
                Formatting typography and preparing reader view
              </p>
            </div>
          ) : (
            <div className="text-center scale-in">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-md">
                <i className="ri-check-line text-2xl" />
              </div>
              <p className="text-lg font-bold text-stone-900">
                {editId ? 'Story updated' : 'Story published'}
              </p>
              <p className="text-xs text-stone-500 mt-1">Redirecting to stories…</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ FLOATING SELECTION TOOLBAR ═══════════ */}
      {showFloatingToolbar && !showLinkInput && (
        <div
          ref={toolbarRef}
          style={{
            position: 'fixed',
            top: toolbarPos.top,
            left: toolbarPos.left,
            transform: 'translateX(-50%)',
            zIndex: 50,
          }}
          className="bg-[#181817] text-white rounded-xl shadow-2xl p-1 flex items-center gap-0.5 font-sans border border-white/10 max-w-[calc(100vw-20px)]"
          onMouseDown={e => e.preventDefault()}
        >
          {[
            { cmd: 'bold', icon: 'ri-bold', key: 'bold', title: 'Bold' },
            { cmd: 'italic', icon: 'ri-italic', key: 'italic', title: 'Italic' },
            { cmd: 'underline', icon: 'ri-underline', key: 'underline', title: 'Underline' },
            { cmd: 'strikeThrough', icon: 'ri-strikethrough', key: 'strikethrough', title: 'Strikethrough' },
          ].map(b => (
            <button
              key={b.cmd}
              type="button"
              title={b.title}
              onMouseDown={e => {
                e.preventDefault();
                execCmd(b.cmd);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm ${activeFormats[b.key]
                  ? 'bg-white text-stone-900'
                  : 'text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              <i className={b.icon} />
            </button>
          ))}

          <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

          {/* Heading H2 + H3 + Quote */}
          <button
            type="button"
            title="Heading"
            onMouseDown={e => {
              e.preventDefault();
              execCmd('formatBlock', '<h2>');
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-colors ${activeFormats.h2
                ? 'bg-white text-stone-900'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            H2
          </button>
          <button
            type="button"
            title="Subheading"
            onMouseDown={e => {
              e.preventDefault();
              execCmd('formatBlock', '<h3>');
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-colors ${activeFormats.h3
                ? 'bg-white text-stone-900'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            H3
          </button>
          <button
            type="button"
            title="Quote"
            onMouseDown={e => {
              e.preventDefault();
              execCmd('formatBlock', '<blockquote>');
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${activeFormats.blockquote
                ? 'bg-white text-stone-900'
                : 'text-stone-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            <i className="ri-double-quotes-l" />
          </button>

          <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

          {/* Text colour */}
          <div ref={colorRef} className="relative">
            <button
              type="button"
              title="Text color"
              onMouseDown={e => {
                e.preventDefault();
                saveSelection();
                setShowColorPicker(v => !v);
                setShowHighlightPicker(false);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:bg-white/10 hover:text-white text-sm"
            >
              <i className="ri-font-color" />
            </button>
            {showColorPicker && (
              <div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#181817] rounded-xl p-2 shadow-2xl border border-white/10 flex gap-1.5 flex-wrap w-44 z-20"
                onMouseDown={e => e.preventDefault()}
              >
                {TEXT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    onMouseDown={e => {
                      e.preventDefault();
                      applyColor(c.value);
                    }}
                    className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/15 shrink-0"
                    style={{ backgroundColor: c.swatch }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight */}
          <div ref={highlightRef} className="relative">
            <button
              type="button"
              title="Highlight"
              onMouseDown={e => {
                e.preventDefault();
                saveSelection();
                setShowHighlightPicker(v => !v);
                setShowColorPicker(false);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:bg-white/10 hover:text-white text-sm"
            >
              <i className="ri-mark-pen-line" />
            </button>
            {showHighlightPicker && (
              <div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#181817] rounded-xl p-2 shadow-2xl border border-white/10 flex gap-1.5 flex-wrap w-40 z-20"
                onMouseDown={e => e.preventDefault()}
              >
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    onMouseDown={e => {
                      e.preventDefault();
                      applyHighlight(c.value);
                    }}
                    className="w-6 h-6 rounded-md hover:scale-110 transition-transform shrink-0"
                    style={{
                      backgroundColor: c.swatch,
                      border: c.border ? '1.5px solid #a8a29e' : '1px solid rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

          {/* Link / Unlink */}
          {activeLinkEl ? (
            <>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  openLinkInput();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sky-400 hover:bg-white/10 text-sm"
                title="Edit link"
              >
                <i className="ri-pencil-line" />
              </button>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  unlinkSelection();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-white/10 text-sm"
                title="Remove link"
              >
                <i className="ri-link-unlink" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                openLinkInput();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:bg-white/10 hover:text-white text-sm"
              title="Add link (⌘K)"
            >
              <i className="ri-link" />
            </button>
          )}
        </div>
      )}

      {/* ═══════════ LINK INPUT POPOVER ═══════════ */}
      {showLinkInput && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/10"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
          />
          <div
            className="fixed z-[60] font-sans"
            style={{
              top: isTouchDevice.current ? 'auto' : Math.max(80, toolbarPos.top),
              bottom: isTouchDevice.current ? '96px' : 'auto',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)',
              maxWidth: '380px',
            }}
          >
            <div className="bg-[#181817] rounded-xl shadow-2xl border border-white/10 p-1.5 flex items-center gap-1.5">
              <i className="ri-link text-stone-400 ml-2 text-sm shrink-0" />
              <input
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === 'Escape') {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }
                }}
                placeholder="https://example.com"
                className="bg-transparent text-white text-xs sm:text-sm outline-none flex-1 min-w-0 px-1.5 py-1.5 placeholder-stone-500"
                autoComplete="url"
              />
              {isEditingLink && (
                <button
                  type="button"
                  onClick={unlinkSelection}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-white/10 transition-colors shrink-0"
                  title="Remove link"
                >
                  <i className="ri-link-unlink text-sm" />
                </button>
              )}
              <button
                type="button"
                onClick={applyLink}
                className="h-7 px-3 rounded-lg bg-white text-stone-900 text-xs font-semibold hover:bg-stone-100 transition-colors shrink-0"
              >
                {isEditingLink ? 'Save' : 'Apply'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
              >
                <i className="ri-close-line text-sm" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ FOCUS MODE EXIT PILL ═══════════ */}
      {isFocusMode && (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="fixed top-4 right-4 z-40 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-900/85 text-white backdrop-blur-md hover:bg-stone-900 transition-all shadow-md font-sans text-xs font-medium"
        >
          <i className="ri-fullscreen-exit-line text-sm" />
          <span className="hidden sm:inline">Exit focus</span>
        </button>
      )}

      {/* ═══════════ TOP STUDIO NAVBAR ═══════════ */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 font-sans ${isFocusMode ? 'opacity-0 -translate-y-full pointer-events-none' : ''
          }`}
      >
        <div className="px-3 sm:px-6 pt-3 pb-2">
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-full px-2.5 sm:px-4 h-12 sm:h-13 flex items-center justify-between shadow-[0_4px_20px_-6px_rgba(20,20,19,0.06)]">
            {/* Left: Back + Save Status */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0"
                title="Go back"
              >
                <i className="ri-arrow-left-line text-base" />
              </button>

              <div className="h-3.5 w-px bg-stone-200 shrink-0" />

              <div className="flex items-center gap-2 text-xs text-stone-500 truncate">
                <span className="font-medium text-stone-700">
                  {editId ? 'Editing story' : 'Draft'}
                </span>
                {saveStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="hidden sm:inline">Saving…</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                    <i className="ri-check-line text-xs" />
                    <span className="hidden sm:inline">Saved</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Word Count + Appearance Settings + Focus Mode + Publish */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 tabular-nums px-2.5 py-1 rounded-full bg-stone-100/70 mr-1">
                <span className="font-medium text-stone-700">{wordCount}</span>
                <span>{wordCount === 1 ? 'word' : 'words'}</span>
                {readTime > 0 && (
                  <>
                    <span className="text-stone-300">·</span>
                    <span>{readTime} min read</span>
                  </>
                )}
              </div>

              {/* Focus Mode Quick Button */}
              <button
                type="button"
                onClick={() => setIsFocusMode(true)}
                className="w-8 h-8 rounded-full hidden sm:flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="Focus mode (⌘⇧F)"
              >
                <i className="ri-focus-2-line text-base" />
              </button>

              {/* Typography & Paper Settings */}
              <div ref={settingsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettingsMenu(v => !v)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showSettingsMenu
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  title="Typography & Paper"
                >
                  <span className="font-serif font-bold text-xs">Aa</span>
                </button>

                {showSettingsMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl p-3.5 z-30">
                    <p className="text-[10.5px] uppercase tracking-wider text-stone-400 font-semibold mb-2">
                      Typography
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 mb-3.5">
                      {FONT_FAMILIES.map(f => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => changeFont(f.value)}
                          className={`py-2 px-1.5 rounded-xl text-center transition-all border ${fontFamily === f.value
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'border-stone-200 text-stone-600 hover:border-stone-300'
                            }`}
                          style={{ fontFamily: f.value }}
                        >
                          <div className="text-sm font-semibold leading-tight">{f.preview}</div>
                          <div className="text-[10px] opacity-75 mt-0.5 font-sans">{f.name}</div>
                        </button>
                      ))}
                    </div>

                    <p className="text-[10.5px] uppercase tracking-wider text-stone-400 font-semibold mb-2">
                      Canvas Surface
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {(
                        [
                          { key: 'clean', label: 'White', dot: '#FFFFFF' },
                          { key: 'paper', label: 'Warm', dot: '#FAF7F2' },
                          { key: 'ruled', label: 'Ruled', dot: '#F8F5EE' },
                        ] as const
                      ).map(p => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => changePaper(p.key)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-medium transition-all border flex items-center justify-center gap-1.5 ${paperMode === p.key
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'border-stone-200 text-stone-600 hover:border-stone-300'
                            }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                            style={{ backgroundColor: p.dot }}
                          />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-stone-100 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFocusMode(true);
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-stone-50 text-stone-700 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium">
                          <i className="ri-fullscreen-line text-sm text-stone-500" />
                          Distraction-free focus
                        </span>
                        <kbd className="text-[10px] text-stone-400 font-mono bg-stone-100 px-1.5 py-0.5 rounded">
                          ⌘⇧F
                        </kbd>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Publish Button */}
              <button
                type="button"
                onClick={handlePublish}
                className="ml-1 h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-[#141413] hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              >
                <span>{editId ? 'Update' : 'Publish'}</span>
                <i className="ri-arrow-right-up-line text-sm opacity-80" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN WRITING CANVAS ═══════════ */}
      <main
        className={`max-w-[680px] mx-auto px-4 sm:px-6 pb-36 sm:pb-44 transition-all duration-300 ${isFocusMode ? 'pt-14 sm:pt-20' : 'pt-4 sm:pt-7'
          }`}
      >
        {/* ── Inline validation error banner ── */}
        {validationError && (
          <div
            className="mb-6 flex items-start gap-3 p-3.5 rounded-2xl border font-sans"
            style={{
              backgroundColor: validationError.field === 'api' ? '#FEF2F2' : '#FFFBEB',
              borderColor: validationError.field === 'api' ? '#FECACA' : '#FDE68A',
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: validationError.field === 'api' ? '#FEE2E2' : '#FEF3C7',
              }}
            >
              <i
                className={`${errorIcon(validationError.field)} text-sm`}
                style={{
                  color: validationError.field === 'api' ? '#DC2626' : '#B45309',
                }}
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p
                className="text-[13px] font-medium leading-snug"
                style={{
                  color: validationError.field === 'api' ? '#991B1B' : '#78350F',
                }}
              >
                {validationError.message}
              </p>
              {validationError.field === 'title' && (
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    titleRef.current?.focus();
                  }}
                  className="text-xs font-semibold text-amber-900 underline underline-offset-2 mt-1"
                >
                  Write title →
                </button>
              )}
              {validationError.field === 'category' && (
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setShowCategoryMenu(true);
                  }}
                  className="text-xs font-semibold text-amber-900 underline underline-offset-2 mt-1"
                >
                  Select a genre →
                </button>
              )}
              {validationError.field === 'content' && (
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    editorRef.current?.focus();
                  }}
                  className="text-xs font-semibold text-amber-900 underline underline-offset-2 mt-1"
                >
                  Continue writing →
                </button>
              )}
              {validationError.field === 'api' && (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="text-xs font-semibold text-red-800 underline underline-offset-2 mt-1"
                >
                  Try again →
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-70 hover:opacity-100"
              style={{
                color: validationError.field === 'api' ? '#991B1B' : '#78350F',
              }}
            >
              <i className="ri-close-line text-sm" />
            </button>
          </div>
        )}

        {/* ── Unsaved Draft Restore Banner ── */}
        {hasDraft && !editId && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white border border-stone-200 shadow-xs font-sans">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-stone-700 text-xs font-medium">
                You have an unsaved draft from your last session
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Restore draft
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* ── Genre & Cover Controls Row ── */}
        <div
          className={`flex flex-wrap items-center gap-2 mb-5 font-sans transition-all duration-300 ${isFocusMode ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'
            }`}
        >
          {/* Genre Picker */}
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryMenu(v => !v)}
              className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all border ${validationError?.field === 'category'
                  ? 'border-amber-400 text-amber-800 bg-amber-50'
                  : selectedCategory
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white/80 border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
            >
              <i className={`${selectedCategory?.icon || 'ri-price-tag-3-line'} text-xs`} />
              <span>{selectedCategory?.label || 'Select genre'}</span>
              <i className="ri-arrow-down-s-line text-xs opacity-60" />
            </button>

            {showCategoryMenu && (
              <div className="absolute top-full mt-1.5 left-0 min-w-[185px] bg-white border border-stone-200 rounded-2xl shadow-xl p-1.5 z-20">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setCategory(c.value);
                      setShowCategoryMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${category === c.value
                        ? 'bg-stone-100 text-stone-900 font-semibold'
                        : 'text-stone-600 hover:bg-stone-50'
                      }`}
                  >
                    <i className={`${c.icon} text-sm text-stone-500`} />
                    <span>{c.label}</span>
                    {category === c.value && (
                      <i className="ri-check-line ml-auto text-stone-900" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Cover Button */}
          {!imagePreview && (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                id="cover-input"
                className="hidden"
                onChange={handleImageChange}
              />
              <label
                htmlFor="cover-input"
                className="h-8 px-3 rounded-full text-xs font-medium text-stone-600 bg-white/80 border border-stone-200 hover:border-stone-300 inline-flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <i className="ri-image-add-line text-xs" />
                <span>Add cover</span>
              </label>
            </>
          )}
        </div>

        {/* ── Cover Image Preview (with Drag-and-Drop + Mobile Controls) ── */}
        {imagePreview && (
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDraggingOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) validateAndSetImage(file);
            }}
            className={`relative mb-7 rounded-2xl overflow-hidden group bg-stone-100 border transition-all duration-300 ${isDraggingOver ? 'border-stone-900 ring-2 ring-stone-900/10' : 'border-stone-200/80'
              } ${isFocusMode ? 'opacity-0 h-0 mb-0 border-none' : ''}`}
            style={{ aspectRatio: '16/9' }}
          >
            <img
              src={imagePreview}
              alt="Story cover"
              className="w-full h-full object-cover block"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 font-sans opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                id="cover-input-replace"
                className="hidden"
                onChange={handleImageChange}
              />
              <label
                htmlFor="cover-input-replace"
                className="bg-black/75 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer backdrop-blur-xs transition-colors inline-flex items-center gap-1"
              >
                <i className="ri-image-edit-line text-xs" />
                <span>Replace</span>
              </label>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-black/75 hover:bg-red-600 text-white w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-xs transition-colors"
                title="Remove cover"
              >
                <i className="ri-delete-bin-6-line text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ── Story Title Input ── */}
        <textarea
          ref={titleRef}
          rows={1}
          placeholder="Story title…"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            syncTitleHeight();
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              editorRef.current?.focus();
            }
          }}
          className={`w-full bg-transparent text-3xl sm:text-4xl md:text-[42px] font-extrabold leading-[1.15] border-none outline-none resize-none overflow-hidden mb-3 tracking-tight transition-colors ${validationError?.field === 'title'
              ? 'placeholder-amber-400/80'
              : 'placeholder-stone-300'
            }`}
          style={{ fontFamily }}
        />

        {/* ── Desktop & Tablet Editorial Formatting Strip ── */}
        <div
          className={`hidden md:flex items-center justify-between py-2 mb-7 border-y border-stone-200/80 font-sans transition-all duration-300 ${isFocusMode ? 'opacity-0 pointer-events-none h-0 py-0 mb-2 border-none overflow-hidden' : ''
            }`}
          onMouseDown={e => e.preventDefault()}
        >
          <div className="flex items-center gap-0.5">
            {[
              { cmd: 'bold', icon: 'ri-bold', key: 'bold', title: 'Bold (⌘B)' },
              { cmd: 'italic', icon: 'ri-italic', key: 'italic', title: 'Italic (⌘I)' },
              { cmd: 'underline', icon: 'ri-underline', key: 'underline', title: 'Underline (⌘U)' },
              { cmd: 'strikeThrough', icon: 'ri-strikethrough', key: 'strikethrough', title: 'Strikethrough' },
            ].map(b => (
              <button
                key={b.cmd}
                type="button"
                title={b.title}
                onMouseDown={e => {
                  e.preventDefault();
                  execCmd(b.cmd);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${activeFormats[b.key]
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
              >
                <i className={b.icon} />
              </button>
            ))}

            <div className="w-px h-4 bg-stone-200 mx-1.5" />

            <button
              type="button"
              title="Heading"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('formatBlock', '<h2>');
              }}
              className={`px-2 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${activeFormats.h2
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
            >
              H2
            </button>
            <button
              type="button"
              title="Subheading"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('formatBlock', '<h3>');
              }}
              className={`px-2 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${activeFormats.h3
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
            >
              H3
            </button>
            <button
              type="button"
              title="Blockquote"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('formatBlock', '<blockquote>');
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${activeFormats.blockquote
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
            >
              <i className="ri-double-quotes-l" />
            </button>

            <div className="w-px h-4 bg-stone-200 mx-1.5" />

            <button
              type="button"
              title="Bulleted list"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('insertUnorderedList');
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${activeFormats.unorderedList
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
            >
              <i className="ri-list-unordered" />
            </button>
            <button
              type="button"
              title="Numbered list"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('insertOrderedList');
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${activeFormats.orderedList
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
            >
              <i className="ri-list-ordered" />
            </button>
            <button
              type="button"
              title="Insert link (⌘K)"
              onMouseDown={e => {
                e.preventDefault();
                openLinkInput();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
            >
              <i className="ri-link" />
            </button>
            <button
              type="button"
              title="Scene divider"
              onMouseDown={e => {
                e.preventDefault();
                insertDivider();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
            >
              <i className="ri-separator" />
            </button>
          </div>

          <span className="text-[11.5px] text-stone-400">
            {new Date().toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* ── Mobile Meta Line ── */}
        <div
          className={`md:hidden flex items-center gap-2 text-xs text-stone-400 mb-6 font-sans ${isFocusMode ? 'opacity-0' : ''
            }`}
        >
          <span>
            {new Date().toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {wordCount > 0 && (
            <>
              <span>·</span>
              <span className="tabular-nums">{readTime} min read</span>
            </>
          )}
        </div>

        {/* ── Rich-Text Story Editor ── */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={e => {
            const html = (e.target as HTMLDivElement).innerHTML;
            updateCounts(html);
            triggerAutoSave();
            if (validationError?.field === 'content') {
              const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
              if (text.length >= 10) setValidationError(null);
            }
          }}
          onKeyUp={checkActiveFormats}
          onClick={checkActiveFormats}
          className={`prose-editor w-full bg-transparent border-none outline-none min-h-[55vh] sm:min-h-[65vh] text-[17px] sm:text-[18.5px] leading-[1.85] text-[#1C1B1A] ${validationError?.field === 'content' ? 'prose-editor-highlight' : ''
            }`}
          data-placeholder="Begin your story…"
          spellCheck
          style={{ fontFamily }}
        />
      </main>

      {/* ═══════════ MOBILE BOTTOM FORMATTING DOCK ═══════════ */}
      <div
        className={`md:hidden fixed bottom-3 left-3 right-3 z-30 font-sans transition-all duration-300 ${isFocusMode ? 'translate-y-24 opacity-0 pointer-events-none' : ''
          }`}
      >
        <div className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl px-2 py-1.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {[
              { cmd: 'bold', icon: 'ri-bold', key: 'bold' },
              { cmd: 'italic', icon: 'ri-italic', key: 'italic' },
              { cmd: 'underline', icon: 'ri-underline', key: 'underline' },
            ].map(b => (
              <button
                key={b.cmd}
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  execCmd(b.cmd);
                }}
                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors text-sm ${activeFormats[b.key]
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 active:bg-stone-100'
                  }`}
              >
                <i className={b.icon} />
              </button>
            ))}

            <div className="w-px h-4 bg-stone-200 mx-1 shrink-0" />

            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('formatBlock', '<h2>');
              }}
              className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold ${activeFormats.h2
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 active:bg-stone-100'
                }`}
            >
              H2
            </button>
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('formatBlock', '<blockquote>');
              }}
              className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm ${activeFormats.blockquote
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 active:bg-stone-100'
                }`}
            >
              <i className="ri-double-quotes-l" />
            </button>
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                execCmd('insertUnorderedList');
              }}
              className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm ${activeFormats.unorderedList
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 active:bg-stone-100'
                }`}
            >
              <i className="ri-list-unordered" />
            </button>
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                openLinkInput();
              }}
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-stone-600 active:bg-stone-100 text-sm"
            >
              <i className="ri-link" />
            </button>
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                insertDivider();
              }}
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-stone-600 active:bg-stone-100 text-sm"
            >
              <i className="ri-separator" />
            </button>
          </div>

          <span className="shrink-0 ml-2 text-[11px] font-semibold tabular-nums px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
            {wordCount}w
          </span>
        </div>
      </div>

      {/* ═══════════ EDITOR STYLES ═══════════ */}
      <style>{`
        .prose-editor:empty::before,
        .prose-editor:has(> br:only-child)::before {
          content: attr(data-placeholder);
          color: #a8a29e;
          pointer-events: none;
        }

        .prose-editor-highlight {
          box-shadow: inset 0 0 0 2px rgba(180, 83, 9, 0.2);
          border-radius: 12px;
          padding: 8px;
        }

        .prose-editor h1 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 1.9rem 0 0.75rem;
          line-height: 1.25;
          letter-spacing: -0.02em;
          color: #141413;
        }
        .prose-editor h2 {
          font-size: 1.45rem;
          font-weight: 700;
          margin: 1.7rem 0 0.65rem;
          line-height: 1.3;
          letter-spacing: -0.015em;
          color: #141413;
        }
        .prose-editor h3 {
          font-size: 1.22rem;
          font-weight: 600;
          margin: 1.4rem 0 0.5rem;
          line-height: 1.38;
          color: #141413;
        }

        .prose-editor p {
          margin: 0 0 1.2em;
        }

        .prose-editor blockquote {
          border-left: 3px solid #141413;
          padding: 0.25rem 0 0.25rem 1.2rem;
          margin: 1.6rem 0;
          font-style: italic;
          color: #57534e;
        }

        .prose-editor ul,
        .prose-editor ol {
          padding-left: 1.5rem;
          margin: 0.85rem 0 1.25rem;
        }
        .prose-editor ul { list-style: disc; }
        .prose-editor ol { list-style: decimal; }
        .prose-editor li { margin: 0.35rem 0; }

        .prose-editor a {
          color: #141413;
          text-decoration: underline;
          text-decoration-color: #a8a29e;
          text-underline-offset: 3px;
          cursor: pointer;
          transition: text-decoration-color 0.15s;
        }
        .prose-editor a:hover {
          text-decoration-color: #141413;
        }

        .prose-editor strong { font-weight: 700; }
        .prose-editor em { font-style: italic; }

        .prose-editor hr,
        .prose-editor .editor-hr {
          border: none;
          height: 1px;
          background: #d6d3d1;
          margin: 2.25rem auto;
          width: 35%;
        }

        .editor-ruled .prose-editor {
          background-image: repeating-linear-gradient(
            transparent 0,
            transparent calc(1.85em - 1px),
            rgba(20, 20, 19, 0.05) calc(1.85em - 1px),
            rgba(20, 20, 19, 0.05) 1.85em
          );
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        button, label { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};