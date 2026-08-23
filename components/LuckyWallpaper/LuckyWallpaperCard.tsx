'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaMagic, FaMobileAlt } from 'react-icons/fa';
import { MdAutoAwesome } from 'react-icons/md';


interface LuckyWallpaperCardProps {
  lifePathNumber?: number;
  personalDay?: number;
  onOpenModal: () => void;
}

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
`;

export const LuckyWallpaperCard: React.FC<LuckyWallpaperCardProps> = ({
  lifePathNumber = 1,
  personalDay = 1,
  onOpenModal,
}) => {
  const bg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4338ca 0%, #581c87 100%)'
  );

  return (
    <Box
      w="full"
      p={{ base: 4, md: 5 }}
      borderRadius="2xl"
      bg={bg}
      color="white"
      boxShadow="xl"
      position="relative"
      overflow="hidden"
      my={4}
    >
      {/* Background Decorative Circles */}
      <Box
        position="absolute"
        top="-40px"
        right="-40px"
        w="160px"
        h="160px"
        bg="whiteAlpha.100"
        borderRadius="full"
        filter="blur(20px)"
      />
      <Box
        position="absolute"
        bottom="-30px"
        left="-30px"
        w="120px"
        h="120px"
        bg="pink.500"
        opacity="0.2"
        borderRadius="full"
        filter="blur(15px)"
      />

      <HStack
        justify="space-between"
        align={{ base: 'start', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        spacing={4}
        position="relative"
        zIndex={1}
      >
        <VStack align="start" spacing={1.5} maxW="600px">
          <HStack spacing={2}>
            <Badge colorScheme="pink" variant="solid" borderRadius="full" px={2.5} py={0.5} fontSize="2xs">
              MỚI / AI FEATURE
            </Badge>
            <HStack spacing={1} color="yellow.300" fontSize="xs" fontWeight="bold">
              <Icon as={MdAutoAwesome} />
              <Text>Số chủ đạo {lifePathNumber} • Ngày cá nhân {personalDay}</Text>
            </HStack>

          </HStack>

          <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="extrabold">
            Hình Nền Thần Số Học May Mắn Hôm Nay
          </Text>

          <Text fontSize="xs" color="whiteAlpha.900" lineHeight="short">
            Khởi tạo hình nền phong thủy độc bản theo bản đồ số học của bạn. Đổi vận mọi lúc với tính năng Reroll không giới hạn!
          </Text>
        </VStack>

        <Button
          leftIcon={<Icon as={FaMagic} />}
          bg="white"
          color="purple.800"
          _hover={{ bg: 'purple.50', transform: 'scale(1.03)' }}
          _active={{ transform: 'scale(0.98)' }}
          size="md"
          px={5}
          borderRadius="xl"
          fontWeight="bold"
          shadow="lg"
          animation={`${pulse} 3s infinite`}
          onClick={onOpenModal}
          alignSelf={{ base: 'stretch', sm: 'auto' }}
        >
          Nhận Hình Nền
        </Button>
      </HStack>
    </Box>
  );
};
