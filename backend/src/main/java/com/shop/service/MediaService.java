package com.shop.service;

import com.shop.exception.BusinessException;
import com.shop.integration.storage.MediaStorage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaService {
    public static final long MAX_FILE_BYTES = 5 * 1024 * 1024;
    private static final long MAX_PIXELS = 40_000_000;
    private final MediaStorage storage;
    public MediaService(MediaStorage storage) { this.storage = storage; }
    public record UploadResult(String url, String objectKey) {}

    public UploadResult upload(MultipartFile file) {
        if (file.getSize() > MAX_FILE_BYTES) throw new BusinessException(HttpStatus.CONTENT_TOO_LARGE, "REQUEST_TOO_LARGE", "File exceeds 5 MiB", Map.of("file", "Maximum file size is 5 MiB"));
        String name = file.getOriginalFilename();
        if (file.isEmpty() || name != null && (name.contains("/") || name.contains("\\") || name.equals("..") || name.equals("."))) throw invalid();
        final byte[] bytes;
        try { bytes = file.getBytes(); } catch (IOException failure) { throw invalid(); }
        String format = format(bytes);
        String mime = switch (format) { case "png" -> "image/png"; case "jpg" -> "image/jpeg"; case "webp" -> "image/webp"; default -> throw invalid(); };
        if (!mime.equals(file.getContentType())) throw invalid();
        validateImage(bytes);
        String key = "products/" + UUID.randomUUID() + "." + format;
        try { return new UploadResult(storage.upload(key, bytes, mime), key); }
        catch (Exception failure) { throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", "Media storage is unavailable"); }
    }

    private String format(byte[] bytes) {
        if (bytes.length >= 8 && Arrays.equals(Arrays.copyOf(bytes, 8), new byte[]{(byte)137,80,78,71,13,10,26,10})) return "png";
        if (bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255) return "jpg";
        if (bytes.length >= 12 && bytes[0]=='R' && bytes[1]=='I' && bytes[2]=='F' && bytes[3]=='F'
                && bytes[8]=='W' && bytes[9]=='E' && bytes[10]=='B' && bytes[11]=='P') return "webp";
        throw invalid();
    }

    private void validateImage(byte[] bytes) {
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid();
            var reader = readers.next();
            try {
                reader.setInput(input);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS || reader.read(0) == null) throw invalid();
            } finally { reader.dispose(); }
        } catch (IOException | RuntimeException failure) { throw invalid(); }
    }
    private BusinessException invalid() {
        return new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", "Invalid image upload",
                Map.of("file", "Use a decodable JPEG, PNG or WebP image, up to 5 MiB and 40 million pixels, with a matching MIME type and a plain filename"));
    }
}
