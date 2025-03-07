import re

abbreviations = {
    "cn1": "công nghệ thông tin (cn1)",
    "cn2": "kỹ thuật máy tính (cn2)",
    "cn3": "vật lý kỹ thuật (cn3)",
    "cn4": "cơ kỹ thuật (cn4)",
    "cn5": "công nghệ kỹ thuật xây dựng (cn5)",
    "cn6": "công nghệ kỹ thuật cơ điện tử (cn6)",
    "cn7": "công nghệ hàng không vũ trụ (cn7)",
    "cn8": "khoa học máy tính (cn8)",
    "cn9": "công nghệ kỹ thuật điện tử viễn thông (cn9)",
    "cn10": "công nghệ nông nghiệp (cn10)",
    "cn11": "kỹ thuật điều khiển và tự động hóa (cn11)",
    "cn12": "trí tuệ nhân tạo (cn12)",
    "cn13": "kỹ thuật năng lượng (cn13)",
    "cn14": "hệ thống thông tin (cn14)",
    "cn15": "mạng máy tính và truyền thông dữ liệu (cn15)",
    "cn16": "công nghệ thông tin đinh hướng thị trường nhật bản(cn16)",
    "cn17": "kỹ thuật robot (cn17)",
    "cn18": "thiết kế công nghiệp và đồ họa (cn18)",
    "cn19": "công nghệ vật liệu (cn19)",
    "cn20": "khoa học dữ liệu (cn20)",
    "cn21": "công nghệ sinh học (cn21)",
    "fit": "khoa công nghệ thông tin",
    "cntt": "công nghệ thông tin",
    "dtvt": "điện tử viễn thông",
    "uet": "Đại học công nghệ"
}

contact_info = """
Để biết thêm thông tin chi tiết, bạn có thể liên hệ qua các kênh thông tin sau:
- Địa chỉ: Nhà E3, 144 Xuân Thủy, Cầu Giấy, Hà Nội.
- Điện thoại: 024.3754.7865 | 0334.924.224 (Hotline).
- Trang chủ: https://uet.vnu.edu.vn/.
- Thông tin tuyển sinh: https://tuyensinh.uet.vnu.edu.vn/.
- Group tư vấn tuyển sinh: https://www.facebook.com/groups/uet.tvts/.
"""

def expand_abbreviations(text):
    def replace(match):
        word = match.group(1).lower()  
        punctuation = match.group(2) or ""  
        return abbreviations.get(word, word) + punctuation  
    pattern = r"\b(\w+)([.,!?;:]?)\b"  
    expanded_text = re.sub(pattern, replace, text)
    
    return expanded_text

def add_contact_info(text):
    return text + "\n\n" + contact_info


if __name__ == "__main__":
    example = 'học phí cn8'
    res = expand_abbreviations(example)
    print(res)