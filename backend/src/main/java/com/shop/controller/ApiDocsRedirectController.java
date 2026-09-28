package com.shop.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ApiDocsRedirectController {
    @GetMapping("/docs")
    public String docs() {
        return "forward:/docs.html";
    }
}
