import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import html2canvas from 'html2canvas';

// 語言類型
type Language = 'zh' | 'en';

// 多語言文字
const translations = {
  zh: {
    title: 'PM 里長伯面相大師',
    subtitle: 'PM MAYORS FACE.FORTUNE.AI v2.0',
    systemStatus: '系統狀態',
    camera: '攝像頭',
    connected: '已連接',
    connecting: '連接中...',
    faceDetection: '面部偵測',
    locked: '已鎖定',
    scanning: '掃描中...',
    faceLocked: '✓ 面部已鎖定',
    waitingDetection: '○ 等待偵測...',
    faceAnalysis: '臉型分析',
    startAnalysis: '開始面相分析',
    alignFace: '請將臉部對準攝像頭',
    analyzing: '面相分析中',
    scanningFeatures: '掃描面部特徵點...',
    analyzingRatios: '分析五官比例...',
    calculatingFortune: '計算面相氣數...',
    generatingReport: '生成運勢報告...',
    analysisReport: '面相分析報告',
    reportSubtitle: 'FACE FORTUNE ANALYSIS REPORT',
    faceShape: '臉型',
    element: '五行',
    luckyNum: '幸運數',
    overallFortune: '總體運勢',
    featureAnalysis: '面部特徵解析',
    personality: '性格特質',
    career: '事業運',
    wealth: '財運',
    love: '感情運',
    health: '健康運',
    luckyGuide: '幸運指引',
    luckyElement: '五行屬性',
    luckyColor: '幸運顏色',
    luckyNumber: '幸運數字',
    reanalyze: '重新分析',
    print: '列印報告',
    saveImage: '儲存圖片',
    saving: '儲存中...',
    poweredBy: 'Powered by MediaPipe Face Mesh',
    features: {
      forehead: '天庭',
      eyebrows: '眉相',
      eyes: '眼相',
      nose: '鼻相',
      mouth: '口相',
      chin: '地閣'
    },
    loading: {
      init: '正在初始化系統...',
      loadingModel: '正在載入面部識別模型...',
      configuring: '正在配置神經網路...',
      startingCamera: '正在啟動攝像頭...',
      failed: '初始化失敗，請刷新頁面重試',
      cameraFailed: '無法存取攝像頭，請確認權限設定'
    },
    footer: {
      slogan: '🏘️ 里長伯幫助您用AI玩轉敏捷',
      provider: 'Provided by Tao Chun Liu (PM Mayors)'
    }
  },
  en: {
    title: 'PM Mayors Face Master',
    subtitle: 'PM MAYORS FACE.FORTUNE.AI v2.0',
    systemStatus: 'System Status',
    camera: 'Camera',
    connected: 'Connected',
    connecting: 'Connecting...',
    faceDetection: 'Face Detection',
    locked: 'Locked',
    scanning: 'Scanning...',
    faceLocked: '✓ Face Locked',
    waitingDetection: '○ Waiting...',
    faceAnalysis: 'Face Analysis',
    startAnalysis: 'Start Face Reading',
    alignFace: 'Please align your face to the camera',
    analyzing: 'Analyzing Face',
    scanningFeatures: 'Scanning facial features...',
    analyzingRatios: 'Analyzing facial ratios...',
    calculatingFortune: 'Calculating fortune...',
    generatingReport: 'Generating report...',
    analysisReport: 'Face Reading Report',
    reportSubtitle: 'FACE FORTUNE ANALYSIS REPORT',
    faceShape: 'Face Shape',
    element: 'Element',
    luckyNum: 'Lucky #',
    overallFortune: 'Overall Fortune',
    featureAnalysis: 'Facial Feature Analysis',
    personality: 'Personality Traits',
    career: 'Career',
    wealth: 'Wealth',
    love: 'Love',
    health: 'Health',
    luckyGuide: 'Lucky Guide',
    luckyElement: 'Element',
    luckyColor: 'Lucky Color',
    luckyNumber: 'Lucky Number',
    reanalyze: 'Analyze Again',
    print: 'Print Report',
    saveImage: 'Save Image',
    saving: 'Saving...',
    poweredBy: 'Powered by MediaPipe Face Mesh',
    features: {
      forehead: 'Forehead',
      eyebrows: 'Eyebrows',
      eyes: 'Eyes',
      nose: 'Nose',
      mouth: 'Mouth',
      chin: 'Chin'
    },
    loading: {
      init: 'Initializing system...',
      loadingModel: 'Loading face detection model...',
      configuring: 'Configuring neural network...',
      startingCamera: 'Starting camera...',
      failed: 'Initialization failed. Please refresh.',
      cameraFailed: 'Cannot access camera. Please check permissions.'
    },
    footer: {
      slogan: '🏘️ Village Chief helps you master Agile with AI',
      provider: 'Provided by Tao Chun Liu (PM Mayors)'
    }
  }
};

// 面相分析結果類型
interface FortuneResult {
  overall: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
  personality: string;
  luckyElement: string;
  luckyColor: string;
  luckyNumber: number;
  faceShape: string;
  features: {
    forehead: string;
    eyebrows: string;
    eyes: string;
    nose: string;
    mouth: string;
    chin: string;
  };
}

// 面部特徵分析數據
interface FaceMetrics {
  faceWidth: number;
  faceHeight: number;
  foreheadHeight: number;
  eyeDistance: number;
  noseLength: number;
  mouthWidth: number;
  chinHeight: number;
  jawWidth: number;
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const resultRef = useRef<HTMLDivElement>(null);
  
  const [language, setLanguage] = useState<Language>('zh');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('正在初始化系統...');
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [hexCode, setHexCode] = useState('');
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const t = translations[language];

  // 檢測是否為手機
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 更新時間
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 生成隨機十六進制代碼
  useEffect(() => {
    const generateHex = () => {
      const hex = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join(' ').toUpperCase();
      setHexCode(hex);
    };
    generateHex();
    const interval = setInterval(generateHex, 100);
    return () => clearInterval(interval);
  }, []);

  // 初始化 MediaPipe FaceLandmarker
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        setLoadingText(translations[language].loading.loadingModel);
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );
        
        setLoadingText(translations[language].loading.configuring);
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1
        });
        
        faceLandmarkerRef.current = faceLandmarker;
        setLoadingText(translations[language].loading.startingCamera);
        await initCamera();
        
      } catch (error) {
        console.error('FaceLandmarker 初始化失敗:', error);
        setLoadingText(translations[language].loading.failed);
      }
    };

    initFaceLandmarker();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初始化攝像頭
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          setIsLoading(false);
          startDetection();
        };
      }
    } catch (error) {
      console.error('攝像頭啟動失敗:', error);
      setLoadingText(translations[language].loading.cameraFailed);
    }
  };

  // 開始面部檢測循環
  const startDetection = useCallback(() => {
    const detect = () => {
      if (videoRef.current && canvasRef.current && faceLandmarkerRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.readyState >= 2) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
          
          // 清除畫布
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            setFaceDetected(true);
            const landmarks = results.faceLandmarks[0];
            
            // 計算面部特徵數據
            calculateFaceMetrics(landmarks, canvas.width, canvas.height);
            
            // 繪製面部網格
            drawFaceMesh(ctx, landmarks, canvas.width, canvas.height);
          } else {
            setFaceDetected(false);
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(detect);
    };
    
    detect();
  }, []);

  // 計算面部特徵數據
  const calculateFaceMetrics = (landmarks: { x: number; y: number; z: number }[], width: number, height: number) => {
    // 關鍵點索引 (MediaPipe Face Mesh)
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const noseTip = landmarks[1];
    const noseBase = landmarks[168];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const jawLeft = landmarks[172];
    const jawRight = landmarks[397];
    
    const metrics: FaceMetrics = {
      faceWidth: Math.abs(rightCheek.x - leftCheek.x) * width,
      faceHeight: Math.abs(chin.y - forehead.y) * height,
      foreheadHeight: Math.abs(landmarks[10].y - landmarks[151].y) * height,
      eyeDistance: Math.abs(rightEye.x - leftEye.x) * width,
      noseLength: Math.abs(noseTip.y - noseBase.y) * height,
      mouthWidth: Math.abs(rightMouth.x - leftMouth.x) * width,
      chinHeight: Math.abs(chin.y - landmarks[17].y) * height,
      jawWidth: Math.abs(jawRight.x - jawLeft.x) * width
    };
    
    setFaceMetrics(metrics);
  };

  // 繪製面部網格
  const drawFaceMesh = (
    ctx: CanvasRenderingContext2D, 
    landmarks: { x: number; y: number; z: number }[],
    width: number,
    height: number
  ) => {
    // 繪製連接線
    ctx.strokeStyle = '#00FFFF40';
    ctx.lineWidth = 1;
    
    // 面部輪廓連接
    const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
    
    ctx.beginPath();
    for (let i = 0; i < faceOval.length; i++) {
      const point = landmarks[faceOval[i]];
      const x = point.x * width;
      const y = point.y * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // 繪製關鍵特徵點
    const keyPoints = [10, 152, 33, 263, 1, 61, 291, 234, 454]; // 額頭、下巴、眼睛、鼻子、嘴巴等
    
    keyPoints.forEach(idx => {
      const point = landmarks[idx];
      const x = point.x * width;
      const y = point.y * height;
      
      // 外圈
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#00FFFF60';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 內圈發光點
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00FFFF';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    // 繪製掃描線效果
    const scanY = (Date.now() % 3000) / 3000 * height;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(width, scanY);
    ctx.strokeStyle = '#00FFFF30';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 繪製十字準星在臉部中心
    const centerX = landmarks[1].x * width;
    const centerY = landmarks[1].y * height;
    
    ctx.strokeStyle = '#FF00FF60';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 30, centerY);
    ctx.lineTo(centerX - 10, centerY);
    ctx.moveTo(centerX + 10, centerY);
    ctx.lineTo(centerX + 30, centerY);
    ctx.moveTo(centerX, centerY - 30);
    ctx.lineTo(centerX, centerY - 10);
    ctx.moveTo(centerX, centerY + 10);
    ctx.lineTo(centerX, centerY + 30);
    ctx.stroke();
  };

  // 分析面相並生成結果
  const analyzeFortune = async () => {
    if (!faceMetrics) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // 模擬分析過程
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    // 等待動畫效果
    await new Promise(resolve => setTimeout(resolve, 2500));
    clearInterval(progressInterval);
    setAnalysisProgress(100);
    
    // 基於面部特徵生成面相結果
    const result = generateFortuneResult(faceMetrics);
    setFortune(result);
    setShowResult(true);
    setIsAnalyzing(false);
  };

  // 根據面部特徵生成面相結果
  const generateFortuneResult = (metrics: FaceMetrics): FortuneResult => {
    // 計算臉型指標
    const ratio = metrics.faceWidth / metrics.faceHeight;
    const jawRatio = metrics.jawWidth / metrics.faceWidth;
    
    // 將比例轉換為 0-100 的分數
    const widthScore = Math.min(100, Math.max(0, (ratio - 0.55) / 0.4 * 100));
    const jawScore = Math.min(100, Math.max(0, (jawRatio - 0.65) / 0.35 * 100));
    
    // 綜合指數 (0-100)
    const compositeScore = (widthScore * 0.6 + jawScore * 0.4);
    
    // 加入隨機擾動 (±15分)
    const randomOffset = (Math.random() - 0.5) * 30;
    const finalScore = Math.min(100, Math.max(0, compositeScore + randomOffset));
    
    // 根據最終分數判斷臉型（四等分）
    let faceShapeKey: 'round' | 'square' | 'long' | 'oval';
    
    if (finalScore >= 75) {
      faceShapeKey = 'round';
    } else if (finalScore >= 50) {
      faceShapeKey = 'square';
    } else if (finalScore >= 25) {
      faceShapeKey = 'oval';
    } else {
      faceShapeKey = 'long';
    }
    
    // 臉型名稱對照
    const faceShapes = {
      zh: { round: '圓臉', square: '方臉', long: '長臉', oval: '瓜子臉' },
      en: { round: 'Round', square: 'Square', long: 'Oblong', oval: 'Oval' }
    };
    
    const faceShape = faceShapes[language][faceShapeKey];
    
    // 面相特徵描述
    const featureDescriptions = {
      zh: {
        forehead: [
          '天庭飽滿，智慧過人',
          '額相平正，思慮周全',
          '額庭含蓄，內斂穩重'
        ],
        eyebrows: ['眉宇開闊，志向高遠', '眉清目秀，聰明伶俐'],
        eyes: [
          '眼距寬闊，心胸開朗',
          '眼距適中，觀察力強',
          '眼距緊湊，專注力佳'
        ],
        nose: [
          '鼻樑高挺，事業心強',
          '鼻相端正，財運穩健',
          '鼻樑秀氣，人緣極佳'
        ],
        mouth: [
          '口闊食祿，福氣深厚',
          '口正言順，誠信待人',
          '櫻桃小口，福祿雙全'
        ],
        chin: [
          '下巴豐厚，晚年有福',
          '下巴圓潤，性格堅毅',
          '下巴尖秀，機智靈活'
        ]
      },
      en: {
        forehead: [
          'Prominent forehead indicates great wisdom',
          'Balanced forehead shows thoughtful nature',
          'Subtle forehead reveals inner strength'
        ],
        eyebrows: ['Wide brow shows ambition', 'Refined brows indicate intelligence'],
        eyes: [
          'Wide-set eyes show open-mindedness',
          'Balanced eye spacing indicates keen observation',
          'Close-set eyes show strong focus'
        ],
        nose: [
          'High nose bridge indicates career ambition',
          'Balanced nose shows stable finances',
          'Refined nose indicates great popularity'
        ],
        mouth: [
          'Wide mouth brings abundance and luck',
          'Balanced mouth shows honesty',
          'Delicate mouth indicates double blessings'
        ],
        chin: [
          'Full chin promises prosperity in later years',
          'Rounded chin shows strong character',
          'Pointed chin indicates wit and agility'
        ]
      }
    };
    
    const getForeheadIdx = () => metrics.foreheadHeight > 60 ? 0 : metrics.foreheadHeight > 40 ? 1 : 2;
    const getEyeIdx = () => metrics.eyeDistance > 70 ? 0 : metrics.eyeDistance > 50 ? 1 : 2;
    const getNoseIdx = () => metrics.noseLength > 50 ? 0 : metrics.noseLength > 35 ? 1 : 2;
    const getMouthIdx = () => metrics.mouthWidth > 60 ? 0 : metrics.mouthWidth > 45 ? 1 : 2;
    const getChinIdx = () => metrics.chinHeight > 40 ? 0 : metrics.chinHeight > 25 ? 1 : 2;
    const getBrowIdx = () => metrics.eyeDistance > 60 ? 0 : 1;
    
    const features = {
      forehead: featureDescriptions[language].forehead[getForeheadIdx()],
      eyebrows: featureDescriptions[language].eyebrows[getBrowIdx()],
      eyes: featureDescriptions[language].eyes[getEyeIdx()],
      nose: featureDescriptions[language].nose[getNoseIdx()],
      mouth: featureDescriptions[language].mouth[getMouthIdx()],
      chin: featureDescriptions[language].chin[getChinIdx()]
    };
    
    // 綜合運勢分析
    const overallScores = [
      metrics.foreheadHeight / 80,
      metrics.eyeDistance / 80,
      metrics.noseLength / 60,
      metrics.mouthWidth / 70,
      metrics.chinHeight / 50
    ];
    const avgScore = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
    
    const fortunes = {
      zh: {
        overall: [
          '大吉大利，諸事順遂！您的面相顯示今年將會是豐收的一年，把握機會，勇往直前。',
          '吉星高照，運勢亨通！面相顯示您具有領導才能，適合開創新局面。',
          '穩中求進，漸入佳境！您的面相顯示穩健發展是您的優勢，循序漸進必有成就。',
          '守得雲開，見月明！面相顯示經過努力後將迎來轉機，保持耐心與信心。'
        ],
        career: [
          '事業運極佳，有升遷或創業成功的機會，貴人運旺盛，把握良機。',
          '工作順利，但需注意細節，與同事合作能創造更大成就。',
          '事業穩定發展中，適合深耕現有領域，不宜過度冒險。',
          '事業面臨轉型期，可考慮學習新技能或拓展新領域。'
        ],
        wealth: [
          '財運亨通，正財偏財皆有收穫，但切記量入為出，適度投資。',
          '財運穩健，正財為主，適合長期投資與儲蓄規劃。',
          '財運平穩，注意開源節流，避免衝動消費。',
          '財運起伏，宜保守理財，避免投機取巧。'
        ],
        love: [
          '桃花運旺盛，單身者有望遇到真命天子/天女，已婚者感情甜蜜。',
          '感情穩定發展，適合深化關係，單身者可多參加社交活動。',
          '感情運平穩，重視溝通與理解，用心經營必有收穫。',
          '感情需要用心經營，多體諒對方，化解小摩擦。'
        ],
        health: [
          '身體健康，精力充沛，但仍需注意作息規律，適度運動。',
          '健康狀況良好，注意飲食均衡，保持運動習慣。',
          '健康尚可，需注意休息，避免過度勞累。',
          '需特別注意身體保養，定期健康檢查，預防勝於治療。'
        ],
        personality: [
          '您性格開朗大方，為人正直善良，具有領導魅力，朋友緣極佳。',
          '您性格沉穩內斂，做事有條理，思維敏捷，適合從事專業工作。',
          '您性格溫和親切，善解人意，具有藝術天賦，創造力豐富。',
          '您性格堅毅果斷，有魄力，執行力強，適合擔任管理職位。'
        ]
      },
      en: {
        overall: [
          'Excellent fortune ahead! Your face reading shows this will be a year of great harvest. Seize opportunities boldly!',
          'Lucky stars shine upon you! Your features indicate leadership qualities, perfect for new ventures.',
          'Steady progress leads to success! Your face shows stability is your strength. Step by step, you will achieve greatness.',
          'After the storm comes the rainbow! Your features show that patience will be rewarded with turning points.'
        ],
        career: [
          'Career fortune is excellent! Opportunities for promotion or successful entrepreneurship await. Helpful people surround you.',
          'Work goes smoothly, but pay attention to details. Collaboration with colleagues brings greater achievements.',
          'Career is developing steadily. Focus on your current field rather than taking excessive risks.',
          'Career is in transition. Consider learning new skills or exploring new territories.'
        ],
        wealth: [
          'Wealth fortune is thriving! Both regular income and windfalls are possible. Remember to invest wisely.',
          'Stable wealth fortune. Regular income is the main source. Long-term investment and savings planning are recommended.',
          'Wealth fortune is steady. Focus on both earning and saving. Avoid impulsive spending.',
          'Wealth has fluctuations. Conservative financial management is advised. Avoid speculative ventures.'
        ],
        love: [
          'Romance is blooming! Singles may meet their soulmate. Married couples enjoy sweet moments together.',
          'Love develops steadily. Good time to deepen relationships. Singles should attend more social activities.',
          'Love life is stable. Communication and understanding are key. Nurturing the relationship will bring rewards.',
          'Love needs careful nurturing. Show more understanding to your partner. Resolve small conflicts with patience.'
        ],
        health: [
          'Good health and abundant energy! Still maintain regular routines and moderate exercise.',
          'Health condition is good. Pay attention to balanced diet and maintain exercise habits.',
          'Health is fair. Need to rest well and avoid overworking.',
          'Pay special attention to health maintenance. Regular check-ups are recommended. Prevention is better than cure.'
        ],
        personality: [
          'You are cheerful and generous, honest and kind-hearted, with natural leadership charisma and excellent social connections.',
          'You are calm and reserved, organized in your work, with quick thinking. Suitable for professional careers.',
          'You are gentle and approachable, understanding of others, with artistic talents and rich creativity.',
          'You are determined and decisive, with strong execution abilities. Suitable for management positions.'
        ]
      }
    };
    
    const luckyElements = {
      zh: ['金', '木', '水', '火', '土'],
      en: ['Metal', 'Wood', 'Water', 'Fire', 'Earth']
    };
    
    const luckyColors = {
      zh: ['金色', '青色', '藍色', '紅色', '黃色'],
      en: ['Gold', 'Cyan', 'Blue', 'Red', 'Yellow']
    };
    
    const idx = Math.floor(avgScore * 4) % 4;
    const elementIdx = Math.floor(metrics.faceWidth + metrics.faceHeight) % 5;
    
    return {
      overall: fortunes[language].overall[idx],
      career: fortunes[language].career[idx],
      wealth: fortunes[language].wealth[idx],
      love: fortunes[language].love[idx],
      health: fortunes[language].health[idx],
      personality: fortunes[language].personality[idx],
      luckyElement: luckyElements[language][elementIdx],
      luckyColor: luckyColors[language][elementIdx],
      luckyNumber: Math.floor(metrics.eyeDistance % 9) + 1,
      faceShape,
      features
    };
  };

  // 重新分析
  const resetAnalysis = () => {
    setShowResult(false);
    setFortune(null);
    setAnalysisProgress(0);
  };

  // 列印報告（桌面版）
  const printReport = () => {
    window.print();
  };

  // 儲存為圖片（手機版）
  const saveAsImage = async () => {
    if (!resultRef.current) return;
    
    setIsSaving(true);
    
    try {
      // 暫時移除一些樣式以獲得更好的截圖效果
      const element = resultRef.current;
      const originalBg = element.style.background;
      element.style.background = '#0a0a0f';
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0a0f',
        scale: 2, // 提高解析度
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      
      element.style.background = originalBg;
      
      // 轉換為圖片並下載
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `PM-Mayors-Face-Fortune-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (error) {
      console.error('儲存圖片失敗:', error);
      // 如果失敗，嘗試使用列印
      window.print();
    } finally {
      setIsSaving(false);
    }
  };

  // 切換語言
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0f] overflow-x-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* 掃描線覆蓋層 */}
      <div className="scan-lines print:hidden" />
      
      {/* 攝像頭視頻背景 - 固定在背景 */}
      <video 
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover opacity-60 print:hidden"
        style={{ filter: 'brightness(0.7) contrast(1.2)' }}
        playsInline
        muted
      />
      
      {/* 面部網格畫布 */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 w-full h-full object-cover print:hidden"
      />
      
      {/* 背景漸層效果 */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f]/80 via-transparent to-[#0a0a0f]/90 print:hidden pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-r from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]/60 print:hidden pointer-events-none" />
      
      {/* 載入畫面 */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0a0a0f] z-50 flex flex-col items-center justify-center">
          {/* Logo */}
          <img 
            src="/logo.png" 
            alt="PM Mayors Logo" 
            className="h-20 w-auto mb-6 drop-shadow-[0_0_20px_rgba(0,255,255,0.5)] animate-pulse"
          />
          
          <div className="relative">
            {/* 旋轉環 */}
            <div className="w-32 h-32 border-2 border-cyan-500/30 rounded-full animate-spin" 
                 style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="absolute inset-4 border-2 border-cyan-400/50 rounded-full animate-spin"
                 style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-fuchsia-400 rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>
            
            {/* 中心圖標 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="8" r="5" strokeWidth="1.5" />
                <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          
          <p className="mt-8 text-cyan-400 font-mono text-lg glow-text-subtle animate-pulse">
            {loadingText}
          </p>
          
          <div className="mt-4 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                   style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          
          {/* 語言切換 */}
          <button
            onClick={toggleLanguage}
            className="mt-6 px-4 py-2 border border-cyan-500/50 rounded text-cyan-400 text-sm font-mono hover:bg-cyan-500/20 transition-colors"
          >
            {language === 'zh' ? 'English' : '中文'}
          </button>
        </div>
      )}
      
      {/* 主 HUD 界面 */}
      {!isLoading && (
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* 語言切換按鈕 */}
          <button
            onClick={toggleLanguage}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 border border-cyan-500/50 rounded-full text-cyan-400 text-sm font-mono hover:bg-cyan-500/20 transition-colors backdrop-blur-sm print:hidden"
          >
            {language === 'zh' ? '🌐 English' : '🌐 中文'}
          </button>
          
          {/* 左上角 - 系統狀態 */}
          <div className="fixed top-14 md:top-4 left-4 z-10 print:hidden">
            <div className="fortune-card p-3 md:p-4 rounded-lg text-xs md:text-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <span className="text-cyan-400 font-mono">{t.systemStatus}</span>
              </div>
              <div className="text-cyan-300/70 font-mono space-y-1">
                <p>{t.camera}: {cameraReady ? t.connected : t.connecting}</p>
                <p>{t.faceDetection}: {faceDetected ? t.locked : t.scanning}</p>
                <p className="text-cyan-500/50 text-[10px] mt-2 hidden md:block">{hexCode}</p>
              </div>
            </div>
          </div>
          
          {/* 右上角 - 標題與時間 */}
          <div className="fixed top-14 md:top-4 right-4 z-10 text-right print:hidden">
            <div className="flex items-center justify-end gap-2 md:gap-3 mb-1">
              <h1 className="font-display text-lg md:text-2xl lg:text-3xl text-cyan-400 glow-text tracking-wider">
                {t.title}
              </h1>
              <img 
                src="/logo.png" 
                alt="PM Mayors Logo" 
                className="h-8 md:h-12 w-auto drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
              />
            </div>
            <p className="text-cyan-300/70 font-mono text-xs md:text-sm mt-1 hidden md:block">
              {t.subtitle}
            </p>
            <p className="text-fuchsia-400 font-mono text-lg md:text-2xl mt-1 md:mt-2 glow-text-subtle">
              {currentTime}
            </p>
            <div className="mt-2 hidden md:flex justify-end gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} 
                     className="w-1 bg-cyan-400/60 rounded-full progress-pulse"
                     style={{ 
                       height: `${15 + Math.random() * 20}px`,
                       animationDelay: `${i * 0.1}s`
                     }} />
              ))}
            </div>
          </div>
          
          {/* 中間內容區 - 佔據主要空間 */}
          <div className="flex-1 flex flex-col items-center justify-center pt-32 md:pt-24 pb-48 md:pb-32 px-4">
            {/* 面部追蹤狀態 */}
            <div className="fortune-card p-4 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full border-2 ${faceDetected ? 'border-cyan-400' : 'border-gray-600'}`}>
                  <svg className="w-full h-full p-2 md:p-3" viewBox="0 0 24 24" fill="none" 
                       stroke={faceDetected ? '#00FFFF' : '#666'}>
                    <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
                    <path d="M4 20v-1a8 8 0 0 1 8-8h0a8 8 0 0 1 8 8v1" strokeWidth="1.5" />
                  </svg>
                  {faceDetected && (
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
                  )}
                </div>
                <div>
                  <p className={`font-mono text-sm ${faceDetected ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {faceDetected ? t.faceLocked : t.waitingDetection}
                  </p>
                  {faceDetected && faceMetrics && (
                    <p className="text-xs text-cyan-300/50 font-mono mt-1">
                      {t.faceAnalysis}: {Math.round(faceMetrics.faceWidth)}x{Math.round(faceMetrics.faceHeight)}px
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 分析按鈕 */}
            {!showResult && !isAnalyzing && (
              <div className="text-center">
                <button
                  onClick={analyzeFortune}
                  disabled={!faceDetected}
                  className={`neon-button px-6 md:px-8 py-3 md:py-4 rounded-lg font-display text-base md:text-lg tracking-wider
                             ${!faceDetected ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}
                >
                  <span className="flex items-center gap-2 md:gap-3">
                    <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                      <path d="M12 6v6l4 2" strokeWidth="1.5" />
                    </svg>
                    {t.startAnalysis}
                  </span>
                </button>
                {!faceDetected && (
                  <p className="text-center text-cyan-400/50 text-sm mt-3 font-mono">
                    {t.alignFace}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* 分析進度 */}
          {isAnalyzing && (
            <div className="fixed inset-0 bg-[#0a0a0f]/80 z-20 flex items-center justify-center p-4 print:hidden">
              <div className="fortune-card p-6 md:p-8 rounded-xl max-w-md w-full text-center">
                <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6">
                  {/* 多層旋轉環 */}
                  <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-spin"
                       style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-2 border-2 border-fuchsia-500/30 rounded-full animate-spin"
                       style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                  <div className="absolute inset-4 border-2 border-cyan-400/50 rounded-full animate-spin"
                       style={{ animationDuration: '1.5s' }} />
                  
                  {/* 中心進度 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-cyan-400 font-display text-xl md:text-2xl glow-text">
                      {Math.min(100, Math.round(analysisProgress))}%
                    </span>
                  </div>
                </div>
                
                <h2 className="text-cyan-400 font-display text-lg md:text-xl mb-3 glow-text-subtle">
                  {t.analyzing}
                </h2>
                
                <div className="space-y-2 text-xs md:text-sm text-cyan-300/70 font-mono">
                  <p className={analysisProgress > 20 ? 'text-cyan-400' : ''}>
                    {analysisProgress > 20 ? '✓' : '○'} {t.scanningFeatures}
                  </p>
                  <p className={analysisProgress > 40 ? 'text-cyan-400' : ''}>
                    {analysisProgress > 40 ? '✓' : '○'} {t.analyzingRatios}
                  </p>
                  <p className={analysisProgress > 60 ? 'text-cyan-400' : ''}>
                    {analysisProgress > 60 ? '✓' : '○'} {t.calculatingFortune}
                  </p>
                  <p className={analysisProgress > 80 ? 'text-cyan-400' : ''}>
                    {analysisProgress > 80 ? '✓' : '○'} {t.generatingReport}
                  </p>
                </div>
                
                {/* 進度條 */}
                <div className="mt-6 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, analysisProgress)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 結果面板 */}
          {showResult && fortune && (
            <div className="fixed inset-0 bg-[#0a0a0f]/95 z-20 overflow-y-auto print:static print:inset-auto print:h-auto print:overflow-visible print:bg-white print:text-black print-container">
              <div ref={resultRef} className="max-w-4xl mx-auto p-4 md:p-6 py-8 md:py-12 pb-40 md:pb-32 print:pb-8 print:py-8 bg-[#0a0a0f]">
                {/* 列印/截圖標題 */}
                <div className="hidden print:flex print:flex-col print:items-center text-center mb-6 border-b-2 border-gray-300 pb-4">
                  <img src="/logo.png" alt="PM Mayors Logo" className="h-16 w-auto mb-2" />
                  <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
                  <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
                </div>
                
                {/* 結果標題 */}
                <div className="text-center mb-6 md:mb-8">
                  <div className="flex items-center justify-center gap-3 mb-2 print:hidden">
                    <img src="/logo.png" alt="PM Mayors Logo" className="h-10 md:h-12 w-auto" />
                  </div>
                  <h2 className="font-display text-2xl md:text-4xl text-cyan-400 glow-text mb-2 print:text-gray-800 print:shadow-none print:text-3xl">
                    {t.analysisReport}
                  </h2>
                  <p className="text-fuchsia-400/70 font-mono text-xs md:text-sm print:text-gray-500 print:hidden">
                    {t.reportSubtitle}
                  </p>
                  <div className="mt-3 md:mt-4 flex justify-center gap-3 md:gap-6 text-xs md:text-sm flex-wrap">
                    <span className="text-cyan-300/70 font-mono print:text-gray-600">{t.faceShape}: {fortune.faceShape}</span>
                    <span className="text-cyan-300/70 font-mono print:text-gray-600">{t.element}: {fortune.luckyElement}</span>
                    <span className="text-cyan-300/70 font-mono print:text-gray-600">{t.luckyNum}: {fortune.luckyNumber}</span>
                  </div>
                </div>
                
                {/* 總體運勢 */}
                <div className="fortune-card p-4 md:p-6 rounded-xl mb-4 md:mb-6 glow-border print:border print:border-gray-300 print:shadow-none print:mb-4">
                  <h3 className="font-display text-lg md:text-xl text-cyan-400 mb-2 md:mb-3 flex items-center gap-2 print:text-gray-800 print:text-lg">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse print:bg-gray-400 print:animate-none" />
                    {t.overallFortune}
                  </h3>
                  <p className="text-cyan-100/90 leading-relaxed text-sm md:text-base print:text-gray-700">{fortune.overall}</p>
                </div>
                
                {/* 面部特徵分析 */}
                <div className="fortune-card p-4 md:p-6 rounded-xl mb-4 md:mb-6 print:border print:border-gray-300 print:mb-4">
                  <h3 className="font-display text-lg md:text-xl text-fuchsia-400 mb-3 md:mb-4 flex items-center gap-2 print:text-gray-800 print:text-lg">
                    <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse print:bg-gray-400 print:animate-none" />
                    {t.featureAnalysis}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 print:gap-2">
                    {Object.entries(fortune.features).map(([key, value]) => {
                      return (
                        <div key={key} className="bg-black/30 p-2 md:p-3 rounded-lg border border-cyan-500/20 print:bg-gray-50 print:border-gray-200 print:p-2">
                          <p className="text-cyan-400 font-mono text-xs mb-1 print:text-gray-500">{t.features[key as keyof typeof t.features]}</p>
                          <p className="text-cyan-100/80 text-xs md:text-sm print:text-gray-700">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* 性格分析 */}
                <div className="fortune-card p-4 md:p-6 rounded-xl mb-4 md:mb-6 print:border print:border-gray-300 print:mb-4">
                  <h3 className="font-display text-lg md:text-xl text-amber-400 mb-2 md:mb-3 flex items-center gap-2 print:text-gray-800 print:text-lg">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse print:bg-gray-400 print:animate-none" />
                    {t.personality}
                  </h3>
                  <p className="text-cyan-100/90 leading-relaxed text-sm md:text-base print:text-gray-700">{fortune.personality}</p>
                </div>
                
                {/* 各項運勢 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6 print:gap-3 print:mb-4">
                  {/* 事業運 */}
                  <div className="fortune-card p-4 md:p-5 rounded-xl print:border print:border-gray-300 print:p-3">
                    <h3 className="font-display text-base md:text-lg text-cyan-400 mb-2 flex items-center gap-2 print:text-gray-800 print:text-base">
                      <svg className="w-4 h-4 md:w-5 md:h-5 print:w-4 print:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="1.5" />
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" />
                      </svg>
                      {t.career}
                    </h3>
                    <p className="text-cyan-100/80 text-xs md:text-sm leading-relaxed print:text-gray-700">{fortune.career}</p>
                  </div>
                  
                  {/* 財運 */}
                  <div className="fortune-card p-4 md:p-5 rounded-xl print:border print:border-gray-300 print:p-3">
                    <h3 className="font-display text-base md:text-lg text-amber-400 mb-2 flex items-center gap-2 print:text-gray-800 print:text-base">
                      <svg className="w-4 h-4 md:w-5 md:h-5 print:w-4 print:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                        <path d="M12 6v12M9 9h6M9 15h6" strokeWidth="1.5" />
                      </svg>
                      {t.wealth}
                    </h3>
                    <p className="text-cyan-100/80 text-xs md:text-sm leading-relaxed print:text-gray-700">{fortune.wealth}</p>
                  </div>
                  
                  {/* 感情運 */}
                  <div className="fortune-card p-4 md:p-5 rounded-xl print:border print:border-gray-300 print:p-3">
                    <h3 className="font-display text-base md:text-lg text-rose-400 mb-2 flex items-center gap-2 print:text-gray-800 print:text-base">
                      <svg className="w-4 h-4 md:w-5 md:h-5 print:w-4 print:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="1.5" />
                      </svg>
                      {t.love}
                    </h3>
                    <p className="text-cyan-100/80 text-xs md:text-sm leading-relaxed print:text-gray-700">{fortune.love}</p>
                  </div>
                  
                  {/* 健康運 */}
                  <div className="fortune-card p-4 md:p-5 rounded-xl print:border print:border-gray-300 print:p-3">
                    <h3 className="font-display text-base md:text-lg text-green-400 mb-2 flex items-center gap-2 print:text-gray-800 print:text-base">
                      <svg className="w-4 h-4 md:w-5 md:h-5 print:w-4 print:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="1.5" />
                      </svg>
                      {t.health}
                    </h3>
                    <p className="text-cyan-100/80 text-xs md:text-sm leading-relaxed print:text-gray-700">{fortune.health}</p>
                  </div>
                </div>
                
                {/* 幸運資訊 */}
                <div className="fortune-card p-4 md:p-6 rounded-xl mb-6 md:mb-8 print:border print:border-gray-300 print:mb-4 print:p-4">
                  <h3 className="font-display text-lg md:text-xl text-fuchsia-400 mb-3 md:mb-4 print:text-gray-800 print:text-lg">{t.luckyGuide}</h3>
                  <div className="flex flex-wrap gap-4 md:gap-6 justify-center print:gap-8">
                    <div className="text-center">
                      <p className="text-cyan-300/60 text-xs font-mono mb-1 print:text-gray-500">{t.luckyElement}</p>
                      <p className="text-xl md:text-2xl text-cyan-400 font-display print:text-gray-800 print:text-xl">{fortune.luckyElement}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-cyan-300/60 text-xs font-mono mb-1 print:text-gray-500">{t.luckyColor}</p>
                      <p className="text-xl md:text-2xl text-amber-400 font-display print:text-gray-800 print:text-xl">{fortune.luckyColor}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-cyan-300/60 text-xs font-mono mb-1 print:text-gray-500">{t.luckyNumber}</p>
                      <p className="text-xl md:text-2xl text-fuchsia-400 font-display print:text-gray-800 print:text-xl">{fortune.luckyNumber}</p>
                    </div>
                  </div>
                </div>
                
                {/* 操作按鈕 */}
                <div className="text-center flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 print:hidden">
                  <button
                    onClick={resetAnalysis}
                    className="neon-button px-6 md:px-8 py-3 md:py-4 rounded-lg font-display text-base md:text-lg tracking-wider"
                  >
                    {t.reanalyze}
                  </button>
                  
                  {/* 手機版：儲存圖片按鈕 */}
                  {isMobile && (
                    <button
                      onClick={saveAsImage}
                      disabled={isSaving}
                      className="px-6 md:px-8 py-3 md:py-4 rounded-lg font-display text-base md:text-lg tracking-wider border-2 border-green-500 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="30 60" />
                          </svg>
                          {t.saving}
                        </span>
                      ) : (
                        <span>📷 {t.saveImage}</span>
                      )}
                    </button>
                  )}
                  
                  {/* 桌面版：列印按鈕 */}
                  {!isMobile && (
                    <button
                      onClick={printReport}
                      className="px-6 md:px-8 py-3 md:py-4 rounded-lg font-display text-base md:text-lg tracking-wider border-2 border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/20 transition-colors"
                    >
                      🖨️ {t.print}
                    </button>
                  )}
                </div>
                
                {/* 署名 - 螢幕版 */}
                <div className="text-center mt-6 md:mt-8 text-cyan-400/30 text-xs font-mono print:hidden">
                  <p>{t.poweredBy}</p>
                  <p className="mt-1">Created by Tao Chun Liu (PM Mayors)</p>
                </div>
                
                {/* 署名 - 列印版 */}
                <div className="hidden print:block text-center mt-6 pt-4 border-t border-gray-300">
                  <p className="text-gray-500 text-xs">{t.poweredBy}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {t.footer.slogan} | {t.footer.provider}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    linkedin.com/in/taochunliu
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* 右側裝飾 */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-5 hidden lg:block print:hidden pointer-events-none">
            <div className="w-px h-64 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
          </div>
          
          {/* 左側裝飾 */}
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-5 hidden lg:block print:hidden pointer-events-none">
            <div className="w-px h-64 bg-gradient-to-b from-transparent via-fuchsia-500/50 to-transparent" />
          </div>
          
          {/* 角落裝飾 */}
          <svg className="fixed top-0 left-0 w-16 md:w-24 h-16 md:h-24 text-cyan-500/30 print:hidden pointer-events-none" viewBox="0 0 100 100">
            <path d="M0 20 L0 0 L20 0" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M0 40 L0 30 L10 30" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="fixed top-0 right-0 w-16 md:w-24 h-16 md:h-24 text-cyan-500/30 print:hidden pointer-events-none" viewBox="0 0 100 100">
            <path d="M100 20 L100 0 L80 0" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M100 40 L100 30 L90 30" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="fixed bottom-20 md:bottom-16 left-0 w-16 md:w-24 h-16 md:h-24 text-fuchsia-500/30 print:hidden pointer-events-none" viewBox="0 0 100 100">
            <path d="M0 80 L0 100 L20 100" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M0 60 L0 70 L10 70" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="fixed bottom-20 md:bottom-16 right-0 w-16 md:w-24 h-16 md:h-24 text-fuchsia-500/30 print:hidden pointer-events-none" viewBox="0 0 100 100">
            <path d="M100 80 L100 100 L80 100" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M100 60 L100 70 L90 70" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          
          {/* 浮動 Footer */}
          <footer className="fixed bottom-0 left-0 right-0 z-30 print:hidden">
            <div className="bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent pt-6 md:pt-8 pb-3 md:pb-4">
              <div className="max-w-4xl mx-auto px-3 md:px-4">
                <div className="fortune-card rounded-xl p-3 md:p-4 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 text-center">
                    <img 
                      src="/logo.png" 
                      alt="PM Mayors Logo" 
                      className="h-6 md:h-8 w-auto"
                    />
                    <span className="text-cyan-300 text-xs sm:text-sm md:text-base">
                      {t.footer.slogan}
                    </span>
                    <span className="hidden sm:inline text-cyan-500/50">|</span>
                    <a 
                      href="https://www.linkedin.com/in/taochunliu/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors text-xs sm:text-sm md:text-base flex items-center gap-1 md:gap-2"
                    >
                      <svg className="w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span className="hidden sm:inline">{t.footer.provider}</span>
                      <span className="sm:hidden">PM Mayors</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
