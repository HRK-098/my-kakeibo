package com.github.hrk.kakeibo_backend.receipt;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.github.hrk.kakeibo_backend.category.CategoryDef;
import com.github.hrk.kakeibo_backend.category.CategoryDefRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/receipt")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class ReceiptScannerController {

  @Value("${gemini.api.key}")
  private String geminiApiKey;

  @Autowired
  private CategoryDefRepository categoryRepository;

  @Autowired
  private ObjectMapper objectMapper;

  private final HttpClient httpClient = HttpClient.newHttpClient();

  @PostMapping("/scan")
  public ResponseEntity<?> scanReceipt(@RequestParam("file") MultipartFile file) {
    // Checked API Key
    String apiKey = geminiApiKey;
    if (apiKey == null || apiKey.trim().isEmpty()) {
      apiKey = System.getenv("GEMINI_API_KEY");
    }
    if (apiKey == null || apiKey.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("messege", "レシートスキャン機能を使用するには、環境変数の設定が必要です。"));
    }

    try {
      // 1. DBからカテゴリ一覧を取得してプロンプトに組み込む
      List<String> categories = categoryRepository.findAll().stream()
          .map(CategoryDef::getName)
          .toList();
      String categoryListStr = String.join(", ", categories);

      // 2. プロンプトの組み立て
      String prompt = "あなたは優秀な家計簿アシスタントです。アップロードされたレシート画像を解析し、以下のカテゴリリストに当てはまる支出項目を抽出してください。\n" +
              "カテゴリリスト: [" + categoryListStr + "]\n\n" +
              "【レシート解析および計算の汎用ルール】\n" +
              "1. **最終支払合計金額（税込・割引後）の特定**:\n" +
              "   - まず、レシートの最下部にある「実際に支払った最終合計金額」（税込、値引き適用後。例: 「合計」「お支払」「領収金額」「WAON支払額」等）を特定し、これを `totalAmount` とします。\n" +
              "2. **個別商品の最終税込価格の算出（汎用アルゴリズム）**:\n" +
              "   - 各商品の表示されている元の価格を抽出します。\n" +
              "   - 各商品の表示価格の合計と、1で特定した `totalAmount` を比較して、以下のように計算してください。\n" +
              "     - **ケースA（表示価格がすでに税込の場合）**: 表示価格の合計が `totalAmount` とほぼ一致する場合、表示価格をそのまま各商品の金額（`amount`）とします。\n" +
              "     - **ケースB（表示価格が税抜きの場合）**: 表示価格の合計が `totalAmount` より小さい場合（消費税が最後にまとめて加算されている場合）、各商品ごとの税率（8%または10%）をレシートの表記（「外8」「※」「軽」など）や商品カテゴリから判定し、それぞれの価格に消費税分を加算した「税込価格」を計算して `amount` としてください。\n" +
              "     - **ケースC（値引き・割引がある場合）**: 表示価格の合計が `totalAmount` より大きい場合（値引きやクーポンが適用されている場合）、値引き額を対象の商品から減算（または全体割引なら各商品に按分）した後の実質価格を `amount` としてください。\n" +
              "3. **合計金額の完全一致（必須）**:\n" +
              "   - どのようなレシート形式であっても、最終的に `items` 内の各商品の金額（`amount`）の総和が、1で特定した `totalAmount`（実際の支払額）と**1円単位で完全に一致**するように、端数や消費税・値引きの計算結果を調整してください。合計が一致しない出力は誤りです。\n\n" +
              "以下のJSONフォーマットのみで返答してください。他の説明やテキスト、```jsonのようなコードブロックの枠は絶対に含めないでください。プレーンなJSONオブジェクトである必要があります。\n\n" +
              "{\n" +
              "  \"date\": \"YYYY-MM-DD\", // レシートの日付。見つからない場合はnull。\n" +
              "  \"items\": [\n" +
              "    {\n" +
              "      \"category\": \"カテゴリ名\", // カテゴリリストから最も適切なものを選択\n" +
              "      \"amount\": 1200,          // 計算後の「税込・割引後」の個別商品の金額 (数値)\n" +
              "      \"description\": \"店舗名や商品名など\" // 簡単な説明\n" +
              "    }\n" +
              "  ],\n" +
              "  \"totalAmount\": 1200 // レシート最下部の「実際に支払った合計金額（税込・割引後）」(数値)\n" +
              "}";

      // 3. 画像データのBase64化
      byte[] imageBytes = file.getBytes();
      String base64Image = Base64.getEncoder().encodeToString(imageBytes);
      String contentType = file.getContentType();
      if (contentType == null) {
        contentType = "image/jpeg";
      }

      // 4. Gemini API へのリクエストボディ作成(Jacksonを使用)
      Map<String, Object> inlineData = Map.of(
          "mimeType", contentType,
          "data", base64Image);
      Map<String, Object> textPart = Map.of("text", prompt);
      Map<String, Object> imagePart = Map.of("inlineData", inlineData);
      Map<String, Object> partContainer = Map.of("parts", List.of(textPart, imagePart));

      // レスポンスのMIMEタイプをJSONにする設定
      Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");

      Map<String, Object> requestBodyMap = Map.of(
          "contents", List.of(partContainer),
          "generationConfig", generationConfig);
      String requestBodyJson = objectMapper.writeValueAsString(requestBodyMap);

      // 5. HTTPリクエストの送信
      // gemini-2.5-flash モデルを使用
      String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
          + apiKey;
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(url))
          .header("content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
          .build();

      HttpResponse<String> response = httpClient.send(request,
          HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() != 200) {
        return ResponseEntity.status(response.statusCode())
            .body(Map.of("message", "Gemini APIの呼び出しに失敗しました: " + response.body()));
      }

      // 6. レスポンスの解析
      JsonNode root = objectMapper.readTree(response.body());
      String responseText = root.path("candidates")
          .path(0)
          .path("content")
          .path("parts")
          .path(0)
          .path("text")
          .asText();

      // JSON文字列をDTOクラスにデシリアライズ
      ReceiptScanResult result = objectMapper.readValue(responseText, ReceiptScanResult.class);

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.internalServerError().body(Map.of("message", "エラーが発生しました: " + e.getMessage()));
    }
  }
}
