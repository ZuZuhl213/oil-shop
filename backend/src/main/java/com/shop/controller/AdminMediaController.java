package com.shop.controller;

import com.shop.service.MediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/media")
@Tag(name = "15. Admin - Media")
public class AdminMediaController {
    private final MediaService service;
    public AdminMediaController(MediaService service) { this.service = service; }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a validated thumbnail; product is saved separately")
    public ResponseEntity<MediaService.UploadResult> upload(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(201).body(service.upload(file));
    }
}
