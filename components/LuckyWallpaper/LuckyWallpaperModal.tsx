'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Input,
  SimpleGrid,
  Image,
  Spinner,
  useToast,
  Icon,
  Tooltip,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaMagic,
  FaDownload,
  FaRedoAlt,
  FaCopy,
  FaCheck,
  FaMobileAlt,
  FaDesktop,
  FaSquare,
  FaHeart,
  FaHistory,
} from 'react-icons/fa';
import { MdAutoAwesome } from 'react-icons/md';
import {
  WALLPAPER_STYLES,
  INTENTION_OPTIONS,
  DEVICE_ASPECT_RATIOS,
  StylePreset,
  IntentionOption,
  DeviceAspectRatio,
} from '@/lib/lucky-wallpaper/constants';

interface LuckyWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifePathNumber?: number;
  personalDay?: number;
  personalYear?: number;
  fullName?: string;
  birthDay?: string;
}

interface SavedWallpaper {
  id: string;
  imageUrl: string;
  seed: number;
  intentionName: string;
  styleName: string;
  aspectRatio: string;
  affirmation: string;
  createdAt: string;
}

const STORAGE_KEY = 'saved_lucky_wallpapers';

export const LuckyWallpaperModal: React.FC<LuckyWallpaperModalProps> = ({
  isOpen,
  onClose,
  lifePathNumber = 1,
  personalDay = 1,
  personalYear = 1,
  fullName = '',
  birthDay = '',
}) => {
  const toast = useToast();

  const [intentionId, setIntentionId] = useState<string>('wealth');
  const [styleId, setStyleId] = useState<string>('sacred_geometry');
  const [deviceType, setDeviceType] = useState<string>('mobile');
  const [customWish, setCustomWish] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  const [currentResult, setCurrentResult] = useState<{
    imageUrl: string;
    prompt: string;
    explanation_vi: string;
    explanation_en: string;
    affirmation_vi: string;
    affirmation_en: string;
    luckyColors_vi: string[];
    seed: number;
    lifePathNumber: number;
    personalDay: number;
    provider?: string;
    model?: string;
    style: StylePreset;
    intention: IntentionOption;
    device: DeviceAspectRatio;
  } | null>(null);



  const [history, setHistory] = useState<SavedWallpaper[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveToHistory = (item: SavedWallpaper) => {
    try {
      const updated = [item, ...history.filter((h) => h.imageUrl !== item.imageUrl)].slice(0, 15);
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleGenerate = async (customSeed?: number) => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/lucky-wallpaper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lifePathNumber,
          personalDay,
          personalYear,
          intentionId,
          styleId,
          deviceType,
          fullName,
          customWish,
          seed: customSeed,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Lỗi tạo hình nền');
      }

      setCurrentResult(data);
      setActiveTab(0); // Switch to display tab

      // Save to history
      saveToHistory({
        id: `wall_${Date.now()}`,
        imageUrl: data.imageUrl,
        seed: data.seed,
        intentionName: data.intention?.name_vi || 'May Mắn',
        styleName: data.style?.name_vi || 'Nghệ Thuật',
        aspectRatio: data.device?.ratio || '9:16',
        affirmation: data.affirmation_vi || '',
        createdAt: new Date().toLocaleDateString('vi-VN'),
      });

      toast({
        title: 'Tạo hình nền may mắn thành công! ✨',
        description: 'Trường năng lượng của bạn đã được hội tụ trong tác phẩm.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: 'Không thể tạo hình ảnh',
        description: err?.message || 'Vui lòng kiểm tra lại kết nối mạng và thử lại.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReroll = () => {
    const newSeed = Math.floor(Math.random() * 10000000);
    handleGenerate(newSeed);
  };

  const handleCopyAffirmation = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.affirmation_vi);
    setIsCopied(true);
    toast({
      title: 'Đã sao chép câu khẳng định!',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownload = async () => {
    if (!currentResult) return;
    try {
      const response = await fetch(currentResult.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hinh_Nen_May_Man_So_${lifePathNumber}_Ngay_${personalDay}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Đang tải hình nền HD xuống...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      window.open(currentResult.imageUrl, '_blank');
    }
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const modalBg = useColorModeValue('gray.50', 'gray.900');
  const borderCol = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('purple.50', 'gray.700');
  const mockupBorder = useColorModeValue('gray.800', 'gray.600');
  const explanationTextColor = useColorModeValue('gray.700', 'gray.300');
  const affirmationBg = useColorModeValue(
    'linear(to-r, purple.50, pink.50)',
    'linear(to-r, gray.800, purple.900)'
  );

  return (

    <Modal isOpen={isOpen} onClose={onClose} size="5xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.700" />
      <ModalContent bg={modalBg} borderRadius="2xl" overflow="hidden" boxShadow="2xl" border="1px solid" borderColor={borderCol}>
        <ModalHeader
          bgGradient="linear(to-r, purple.600, blue.600, pink.500)"
          color="white"
          py={4}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Icon as={FaMagic} />
          <Text fontSize="xl" fontWeight="bold">
            Hình Nền Thần Số Học May Mắn (Lucky Wallpaper AI)
          </Text>
        </ModalHeader>
        <ModalCloseButton color="white" top={4} right={4} />

        <ModalBody p={6}>
          <Tabs isFitted variant="enclosed" index={activeTab} onChange={(index) => setActiveTab(index)} colorScheme="purple">
            <TabList mb={4}>
              <Tab fontWeight="semibold">
                {currentResult ? '🖼️ Hình Nền Của Bạn' : '✨ Thiết Lập & Tạo Ảnh'}
              </Tab>
              <Tab fontWeight="semibold">
                ⚙️ Tùy Chỉnh Năng Lượng
              </Tab>
              <Tab fontWeight="semibold">
                <HStack spacing={1}>
                  <Icon as={FaHistory} />
                  <Text>Bộ Sưu Tập ({history.length})</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* PANEL 1: RESULT & PREVIEW / GENERATE */}
              <TabPanel p={0}>
                {isLoading ? (
                  <VStack py={16} spacing={6} align="center">
                    <Box position="relative">
                      <Spinner size="xl" thickness="4px" speed="0.8s" color="purple.500" />
                    </Box>
                    <VStack spacing={2} textAlign="center">
                      <Text fontSize="lg" fontWeight="bold" bgGradient="linear(to-r, purple.500, pink.500)" bgClip="text">
                        Đang hội tụ năng lượng Thần số học và khởi tạo tác phẩm...
                      </Text>
                      <Text fontSize="sm" color="gray.500" maxW="400px">
                        Đang dệt các biểu tượng hình học thiêng, sắc màu may mắn của Số chủ đạo {lifePathNumber} và Ngày cá nhân {personalDay}.
                      </Text>
                    </VStack>
                  </VStack>
                ) : currentResult ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} alignItems="start">
                    {/* Visual Mockup Frame */}
                    <VStack spacing={4} align="center">
                      <Box
                        position="relative"
                        maxW={currentResult.device.ratio === '16:9' ? '420px' : '300px'}
                        w="full"
                        borderRadius="2xl"
                        overflow="hidden"
                        boxShadow="0 20px 40px -15px rgba(0,0,0,0.5)"
                        border="4px solid"
                        borderColor={mockupBorder}

                        bg="black"
                      >
                        <Image
                          src={currentResult.imageUrl}
                          alt="Lucky Wallpaper"
                          w="full"
                          h="auto"
                          objectFit="cover"
                          transition="transform 0.3s ease"
                          _hover={{ transform: 'scale(1.02)' }}
                          fallback={
                            <VStack h="380px" justify="center" bg="gray.900" color="white" spacing={3}>
                              <Spinner color="purple.400" />
                              <Text fontSize="xs">Đang tải ảnh chất lượng cao...</Text>
                            </VStack>
                          }
                        />
                        {/* Device Notch/Bar Simulation for Mobile */}
                        {currentResult.device.ratio === '9:16' && (
                          <Box
                            position="absolute"
                            top={2}
                            left="50%"
                            transform="translateX(-50%)"
                            w="70px"
                            h="14px"
                            bg="blackAlpha.800"
                            borderRadius="full"
                          />
                        )}
                      </Box>

                      {/* Action Buttons */}
                      <HStack spacing={3} w="full" justify="center">
                        <Button
                          leftIcon={<Icon as={FaDownload} />}
                          colorScheme="purple"
                          size="md"
                          onClick={handleDownload}
                          shadow="md"
                        >
                          Tải Ảnh HD
                        </Button>
                        <Button
                          leftIcon={<Icon as={FaRedoAlt} />}
                          colorScheme="pink"
                          variant="outline"
                          size="md"
                          onClick={handleReroll}
                        >
                          Đổi Vận (Tạo lại)
                        </Button>
                      </HStack>
                    </VStack>

                    {/* Metadata & Meaning Cards */}
                    <VStack spacing={4} align="stretch">
                      {/* Energy Tags */}
                      <Box bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderCol}>
                        <HStack spacing={2} mb={2} wrap="wrap">
                          <Badge colorScheme="purple" px={2.5} py={1} borderRadius="md">
                            Số chủ đạo: {currentResult.lifePathNumber}
                          </Badge>
                          <Badge colorScheme="blue" px={2.5} py={1} borderRadius="md">
                            Ngày cá nhân: {currentResult.personalDay}
                          </Badge>
                          <Badge colorScheme="pink" px={2.5} py={1} borderRadius="md">
                            {currentResult.intention.name_vi}
                          </Badge>
                          <Badge colorScheme="teal" px={2.5} py={1} borderRadius="md">
                            {currentResult.style.name_vi}
                          </Badge>
                          {currentResult.provider && (
                            <Badge colorScheme="green" variant="outline" px={2.5} py={1} borderRadius="md">
                              {currentResult.provider === 'subnp' ? '🪄 Subnp Magic' : '⚡ FLUX AI'}
                            </Badge>
                          )}
                        </HStack>

                        <HStack spacing={1} fontSize="xs" color="gray.500" mt={1}>
                          <Text fontWeight="semibold">Màu sắc may mắn:</Text>
                          <Text>{currentResult.luckyColors_vi.slice(0, 3).join(', ')}</Text>
                        </HStack>
                      </Box>

                      {/* Explanation Card */}
                      <Box bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderCol}>
                        <Text fontSize="sm" fontWeight="bold" color="purple.500" mb={1}>
                          🔮 Luận giải năng lượng & Phong thủy:
                        </Text>
                        <Text fontSize="sm" lineHeight="tall" color={explanationTextColor}>
                          {currentResult.explanation_vi}
                        </Text>
                      </Box>

                      {/* Affirmation Card */}
                      <Box
                        bgGradient={affirmationBg}
                        p={4}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="purple.300"
                        position="relative"
                      >
                        <HStack justify="space-between" align="start">

                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="bold" color="purple.600" textTransform="uppercase">
                              Câu Khẳng Định Kích Hoạt Năng Lượng:
                            </Text>
                            <Text fontSize="sm" fontWeight="medium" fontStyle="italic">
                              &ldquo;{currentResult.affirmation_vi}&rdquo;
                            </Text>
                          </VStack>
                          <Tooltip label={isCopied ? 'Đã chép!' : 'Sao chép câu khẳng định'}>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="purple"
                              onClick={handleCopyAffirmation}
                            >
                              <Icon as={isCopied ? FaCheck : FaCopy} />
                            </Button>
                          </Tooltip>
                        </HStack>
                      </Box>

                      <Button
                        size="sm"
                        variant="link"
                        colorScheme="purple"
                        alignSelf="start"
                        onClick={() => setActiveTab(1)}
                      >
                        ← Thay đổi phong cách hoặc ý định
                      </Button>
                    </VStack>
                  </SimpleGrid>
                ) : (
                  <VStack py={8} spacing={6} align="center">
                    <Box
                      p={4}
                      borderRadius="full"
                      bgGradient="linear(to-br, purple.500, pink.500)"
                      color="white"
                      boxShadow="lg"
                    >
                      <Icon as={FaMagic} boxSize={8} />
                    </Box>
                    <VStack spacing={2} textAlign="center" maxW="480px">
                      <Text fontSize="xl" fontWeight="bold">
                        Tạo Hình Nền Phong Thủy Cá Nhân Hóa
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Kết hợp năng lượng Số chủ đạo <strong>{lifePathNumber}</strong> và Ngày cá nhân <strong>{personalDay}</strong> để dệt nên tác phẩm hình nền trợ mệnh độc nhất vô nhị.
                      </Text>
                    </VStack>
                    <Button
                      size="lg"
                      colorScheme="purple"
                      bgGradient="linear(to-r, purple.500, pink.500)"
                      _hover={{ bgGradient: 'linear(to-r, purple.600, pink.600)' }}
                      px={8}
                      shadow="lg"
                      onClick={() => handleGenerate()}
                    >
                      ✨ Khởi Tạo Hình Nền Ngay
                    </Button>
                  </VStack>
                )}
              </TabPanel>

              {/* PANEL 2: SETTINGS & CUSTOMIZATION */}
              <TabPanel p={2}>
                <VStack spacing={6} align="stretch">
                  {/* 1. Intention Selection */}
                  <Box>
                    <Text fontSize="md" fontWeight="bold" mb={3}>
                      1. Chọn Ý Định / Mong Ước Hôm Nay:
                    </Text>
                    <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={3}>
                      {INTENTION_OPTIONS.map((item) => {
                        const isSelected = intentionId === item.id;
                        return (
                          <Box
                            key={item.id}
                            p={3}
                            borderRadius="xl"
                            cursor="pointer"
                            border="2px solid"
                            borderColor={isSelected ? 'purple.500' : borderCol}
                            bg={isSelected ? selectedBg : cardBg}
                            transition="all 0.2s"
                            _hover={{ transform: 'translateY(-2px)', shadow: 'sm' }}
                            onClick={() => setIntentionId(item.id)}
                          >
                            <HStack spacing={2}>
                              <Text fontSize="xl">{item.icon}</Text>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="bold">
                                  {item.name_vi.split('&')[0].trim()}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {item.name_vi.split('&')[1]?.trim() || ''}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  </Box>

                  <Divider />

                  {/* 2. Style Preset Selection */}
                  <Box>
                    <Text fontSize="md" fontWeight="bold" mb={3}>
                      2. Chọn Phong Cách Nghệ Thuật:
                    </Text>
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                      {WALLPAPER_STYLES.map((style) => {
                        const isSelected = styleId === style.id;
                        return (
                          <Box
                            key={style.id}
                            p={3}
                            borderRadius="xl"
                            cursor="pointer"
                            border="2px solid"
                            borderColor={isSelected ? style.themeColor : borderCol}
                            bg={isSelected ? selectedBg : cardBg}
                            transition="all 0.2s"
                            _hover={{ transform: 'translateY(-2px)', shadow: 'sm' }}
                            onClick={() => setStyleId(style.id)}
                          >
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="sm" fontWeight="bold">
                                {style.name_vi}
                              </Text>
                              <Box w={3} h={3} borderRadius="full" bg={style.themeColor} />
                            </HStack>
                            <Text fontSize="xs" color="gray.500" noOfLines={2}>
                              {style.description_vi}
                            </Text>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  </Box>

                  <Divider />

                  {/* 3. Device Ratio Selection */}
                  <Box>
                    <Text fontSize="md" fontWeight="bold" mb={3}>
                      3. Chọn Thiết Bị & Khung Hình:
                    </Text>
                    <SimpleGrid columns={3} spacing={3}>
                      {DEVICE_ASPECT_RATIOS.map((dev) => {
                        const isSelected = deviceType === dev.id;
                        const icon =
                          dev.id === 'mobile' ? FaMobileAlt : dev.id === 'desktop' ? FaDesktop : FaSquare;
                        return (
                          <Box
                            key={dev.id}
                            p={3}
                            borderRadius="xl"
                            cursor="pointer"
                            border="2px solid"
                            borderColor={isSelected ? 'purple.500' : borderCol}
                            bg={isSelected ? selectedBg : cardBg}
                            textAlign="center"
                            onClick={() => setDeviceType(dev.id)}
                          >
                            <Icon as={icon} boxSize={5} mb={1} color={isSelected ? 'purple.500' : 'gray.500'} />
                            <Text fontSize="xs" fontWeight="bold">
                              {dev.label_vi}
                            </Text>
                            <Badge fontSize="2xs" colorScheme="purple">
                              {dev.ratio}
                            </Badge>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  </Box>


                  {/* 4. Optional Custom Wish */}
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                      Lời chúc / Chi tiết riêng muốn gửi gắm (Không bắt buộc):
                    </Text>
                    <Input
                      placeholder="Ví dụ: thu hút hợp đồng mới, bình yên thi cử..."
                      size="sm"
                      borderRadius="lg"
                      value={customWish}
                      onChange={(e) => setCustomWish(e.target.value)}
                    />
                  </Box>

                  <Button
                    size="lg"
                    colorScheme="purple"
                    bgGradient="linear(to-r, purple.500, pink.500)"
                    _hover={{ bgGradient: 'linear(to-r, purple.600, pink.600)' }}
                    isLoading={isLoading}
                    loadingText="Đang khởi tạo tác phẩm..."
                    onClick={() => handleGenerate()}
                  >
                    ✨ Áp Dụng & Tạo Hình Nền
                  </Button>
                </VStack>
              </TabPanel>

              {/* PANEL 3: HISTORY GALLERY */}
              <TabPanel p={2}>
                {history.length === 0 ? (
                  <VStack py={12} spacing={3} color="gray.500">
                    <Icon as={FaHistory} boxSize={8} />
                    <Text fontSize="sm">Chưa có hình nền nào được lưu.</Text>
                  </VStack>
                ) : (
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={4}>
                    {history.map((item) => (
                      <Box
                        key={item.id}
                        borderRadius="xl"
                        overflow="hidden"
                        bg={cardBg}
                        border="1px solid"
                        borderColor={borderCol}
                        shadow="sm"
                        cursor="pointer"
                        _hover={{ shadow: 'md', transform: 'scale(1.02)' }}
                        onClick={() => {
                          window.open(item.imageUrl, '_blank');
                        }}
                      >
                        <Image src={item.imageUrl} alt={item.styleName} h="160px" w="full" objectFit="cover" />
                        <Box p={2}>
                          <HStack justify="space-between" mb={1}>
                            <Badge fontSize="2xs" colorScheme="purple">
                              {item.intentionName}
                            </Badge>
                            <Badge fontSize="2xs">{item.aspectRatio}</Badge>
                          </HStack>
                          <Text fontSize="2xs" color="gray.500">
                            {item.createdAt}
                          </Text>
                        </Box>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
