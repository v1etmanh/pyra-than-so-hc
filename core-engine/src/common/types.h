#pragma once
#include <cstdint>
#include <cstddef>
#include <string>
#include <vector>

namespace numina {

using page_id_t = uint32_t;
using frame_id_t = uint32_t;
using lsn_t = uint64_t;
using txn_id_t = uint64_t;
using slot_offset_t = uint16_t;

static constexpr page_id_t INVALID_PAGE_ID = 0xFFFFFFFF;
static constexpr txn_id_t INVALID_TXN_ID = 0;
static constexpr size_t PAGE_SIZE = 4096;
static constexpr size_t BUFFER_POOL_SIZE = 64; // 64 pages in RAM cache

struct RID {
    page_id_t page_id{INVALID_PAGE_ID};
    uint16_t slot_id{0};

    bool operator==(const RID& other) const {
        return page_id == other.page_id && slot_id == other.slot_id;
    }
};

enum class DataType : uint8_t {
    INTEGER = 1,
    BIGINT  = 2,
    VARCHAR = 3,
    BOOLEAN = 4
};

enum class EngineType : uint8_t {
    BTREE   = 1,
    SSTABLE = 2
};

enum class TxnStatus : uint8_t {
    RUNNING   = 1,
    COMMITTED = 2,
    ABORTED   = 3
};

} // namespace numina
