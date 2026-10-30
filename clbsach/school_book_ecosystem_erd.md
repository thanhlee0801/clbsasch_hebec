<mxfile host="app.diagrams.net" modified="2026-10-09T00:00:00.000Z" agent="Gemini" version="21.0.0" type="device">
  <diagram id="erd_diagram" name="CSDL_HeSinhThaiSachHocDuong">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" background="#ffffff">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Helper Style Presets -->
        <!-- Group Container Style -->
        <!-- Entity Header Style: fill="#0052CC" fontColor="#ffffff" -->
        <!-- Entity Row Style: fill="#ffffff" align=left -->

        <!-- ==================== GROUP 1: IDENTITY & ORG ==================== -->
        <mxCell id="group_identity" value="1. Identity &amp; Organization" style="swimlane;whiteSpace=wrap;html=1;fillColor=#E1F5FE;strokeColor=#0288D1;fontStyle=1;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="460" height="340" as="geometry" />
        </mxCell>

        <!-- Entity: User -->
        <mxCell id="ent_user" value="User&#10;------------------&#10;+ id (PK) : INT&#10;full_name : VARCHAR&#10;email : VARCHAR&#10;role : ENUM&#10;parent_id (FK) : INT&#10;consent_status : BOOL" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#1565C0;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_identity">
          <mxGeometry x="20" y="50" width="180" height="120" as="geometry" />
        </mxCell>

        <!-- Entity: Organization -->
        <mxCell id="ent_org" value="Organization&#10;------------------&#10;+ id (PK) : INT&#10;name : VARCHAR&#10;type : ENUM&#10;parent_id (FK) : INT&#10;org_code : VARCHAR" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#1565C0;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_identity">
          <mxGeometry x="250" y="50" width="180" height="110" as="geometry" />
        </mxCell>

        <!-- Entity: Membership -->
        <mxCell id="ent_member" value="Membership&#10;------------------&#10;+ user_id (FK) : INT&#10;+ organization_id (FK) : INT&#10;role_in_org : VARCHAR&#10;joined_at : TIMESTAMP" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#1565C0;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_identity">
          <mxGeometry x="135" y="210" width="190" height="90" as="geometry" />
        </mxCell>

        <!-- Links in Group 1 -->
        <mxCell id="edge_user_parent" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToMany;startArrow=ERzeroToOne;strokeColor=#1565C0;" edge="1" parent="group_identity" source="ent_user" target="ent_user">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="110" y="30" />
              <mxPoint x="180" y="30" />
              <mxPoint x="180" y="70" />
            </Array>
          </mxGeometry>
        </mxCell>

        <mxCell id="edge_org_parent" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToMany;startArrow=ERzeroToOne;strokeColor=#1565C0;" edge="1" parent="group_identity" source="ent_org" target="ent_org">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="340" y="30" />
              <mxPoint x="410" y="30" />
              <mxPoint x="410" y="70" />
            </Array>
          </mxGeometry>
        </mxCell>

        <mxCell id="edge_user_member" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#1565C0;" edge="1" parent="group_identity" source="ent_user" target="ent_member">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_org_member" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#1565C0;" edge="1" parent="group_identity" source="ent_org" target="ent_member">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>


        <!-- ==================== GROUP 2: CONTENT & READING ==================== -->
        <mxCell id="group_content" value="2. Content &amp; Reading" style="swimlane;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#43A047;fontStyle=1;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="540" y="40" width="500" height="340" as="geometry" />
        </mxCell>

        <mxCell id="ent_work" value="Work&#10;------------------&#10;+ id (PK) : INT&#10;organization_id (FK) : INT&#10;title : VARCHAR&#10;content_type : ENUM&#10;moderation_status : ENUM&#10;visibility : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#C8E6C9;strokeColor=#2E7D32;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_content">
          <mxGeometry x="20" y="50" width="200" height="120" as="geometry" />
        </mxCell>

        <mxCell id="ent_work_author" value="WorkAuthor&#10;------------------&#10;+ work_id (FK) : INT&#10;+ user_id (FK) : INT&#10;is_primary : BOOL" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#C8E6C9;strokeColor=#2E7D32;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_content">
          <mxGeometry x="280" y="50" width="180" height="80" as="geometry" />
        </mxCell>

        <mxCell id="ent_reading_log" value="ReadingLog&#10;------------------&#10;+ id (PK) : INT&#10;user_id (FK) : INT&#10;book_title : VARCHAR&#10;reading_time_minutes : INT&#10;read_date : DATE" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#C8E6C9;strokeColor=#2E7D32;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_content">
          <mxGeometry x="280" y="190" width="200" height="110" as="geometry" />
        </mxCell>

        <mxCell id="edge_work_author" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#2E7D32;" edge="1" parent="group_content" source="ent_work" target="ent_work_author">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>


        <!-- ==================== GROUP 3: AI BOOK STUDIO ==================== -->
        <mxCell id="group_aistudio" value="3. AI Book Studio" style="swimlane;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#FB8C00;fontStyle=1;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="40" y="420" width="460" height="420" as="geometry" />
        </mxCell>

        <mxCell id="ent_book_project" value="BookProject&#10;------------------&#10;+ id (PK) : INT&#10;owner_id (FK) : INT&#10;title : VARCHAR&#10;genre : VARCHAR&#10;workflow_status : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#FFE0B2;strokeColor=#EF6C00;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_aistudio">
          <mxGeometry x="20" y="50" width="190" height="110" as="geometry" />
        </mxCell>

        <mxCell id="ent_book_chapter" value="BookChapter&#10;------------------&#10;+ id (PK) : INT&#10;book_id (FK) : INT&#10;chapter_order : INT&#10;title : VARCHAR&#10;status : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#FFE0B2;strokeColor=#EF6C00;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_aistudio">
          <mxGeometry x="250" y="50" width="180" height="100" as="geometry" />
        </mxCell>

        <mxCell id="ent_reference" value="Reference&#10;------------------&#10;+ id (PK) : INT&#10;book_id (FK) : INT&#10;owner_id (FK) : INT&#10;source_type : ENUM&#10;file_url : VARCHAR" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#FFE0B2;strokeColor=#EF6C00;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_aistudio">
          <mxGeometry x="20" y="220" width="190" height="100" as="geometry" />
        </mxCell>

        <mxCell id="ent_ai_interaction" value="AIInteraction&#10;------------------&#10;+ id (PK) : INT&#10;user_id (FK) : INT&#10;module : VARCHAR&#10;input_context : TEXT&#10;model_used : VARCHAR" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#FFE0B2;strokeColor=#EF6C00;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_aistudio">
          <mxGeometry x="250" y="220" width="180" height="100" as="geometry" />
        </mxCell>

        <mxCell id="edge_book_chapter" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#EF6C00;" edge="1" parent="group_aistudio" source="ent_book_project" target="ent_book_chapter">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_book_ref" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToMany;startArrow=ERzeroToOne;strokeColor=#EF6C00;" edge="1" parent="group_aistudio" source="ent_book_project" target="ent_reference">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>


        <!-- ==================== GROUP 4: MAGAZINE STUDIO ==================== -->
        <mxCell id="group_magazine" value="4. Magazine Studio" style="swimlane;whiteSpace=wrap;html=1;fillColor=#F3E5F5;strokeColor=#8E24AA;fontStyle=1;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="540" y="420" width="500" height="220" as="geometry" />
        </mxCell>

        <mxCell id="ent_magazine" value="Magazine&#10;------------------&#10;+ id (PK) : INT&#10;school_id (FK) : INT&#10;issue_number : VARCHAR&#10;title : VARCHAR&#10;status : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#E1BEE7;strokeColor=#6A1B9A;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_magazine">
          <mxGeometry x="20" y="50" width="190" height="110" as="geometry" />
        </mxCell>

        <mxCell id="ent_article" value="Article&#10;------------------&#10;+ id (PK) : INT&#10;magazine_id (FK) : INT&#10;work_id (FK) : INT&#10;section_name : VARCHAR&#10;review_status : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#E1BEE7;strokeColor=#6A1B9A;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_magazine">
          <mxGeometry x="270" y="50" width="200" height="110" as="geometry" />
        </mxCell>

        <mxCell id="edge_mag_article" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#6A1B9A;" edge="1" parent="group_magazine" source="ent_magazine" target="ent_article">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>


        <!-- ==================== GROUP 5: COMPETITION ==================== -->
        <mxCell id="group_competition" value="5. Competition &amp; Judging" style="swimlane;whiteSpace=wrap;html=1;fillColor=#FCE4EC;strokeColor=#D81B60;fontStyle=1;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="1080" y="40" width="480" height="600" as="geometry" />
        </mxCell>

        <mxCell id="ent_competition" value="Competition&#10;------------------&#10;+ id (PK) : INT&#10;organizer_id (FK) : INT&#10;title : VARCHAR&#10;rubric_config : JSON&#10;status : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#F8BBD0;strokeColor=#AD1457;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_competition">
          <mxGeometry x="20" y="50" width="200" height="110" as="geometry" />
        </mxCell>

        <mxCell id="ent_submission" value="Submission&#10;------------------&#10;+ id (PK) : INT&#10;competition_id (FK) : INT&#10;work_id (FK) : INT&#10;eligibility_status : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#F8BBD0;strokeColor=#AD1457;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_competition">
          <mxGeometry x="260" y="50" width="190" height="100" as="geometry" />
        </mxCell>

        <mxCell id="ent_judge" value="Judge&#10;------------------&#10;+ id (PK) : INT&#10;competition_id (FK) : INT&#10;user_id (FK) : INT&#10;conflict_status : BOOL" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#F8BBD0;strokeColor=#AD1457;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_competition">
          <mxGeometry x="20" y="230" width="200" height="90" as="geometry" />
        </mxCell>

        <mxCell id="ent_score" value="Score&#10;------------------&#10;+ id (PK) : INT&#10;submission_id (FK) : INT&#10;judge_id (FK) : INT&#10;rubric_item : VARCHAR&#10;score : DECIMAL" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#F8BBD0;strokeColor=#AD1457;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_competition">
          <mxGeometry x="260" y="230" width="190" height="110" as="geometry" />
        </mxCell>

        <mxCell id="ent_award" value="Award&#10;------------------&#10;+ id (PK) : INT&#10;competition_id (FK) : INT&#10;submission_id (FK) : INT&#10;prize : VARCHAR" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#F8BBD0;strokeColor=#AD1457;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_competition">
          <mxGeometry x="140" y="440" width="200" height="90" as="geometry" />
        </mxCell>

        <mxCell id="edge_comp_sub" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#AD1457;" edge="1" parent="group_competition" source="ent_competition" target="ent_submission">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_comp_judge" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#AD1457;" edge="1" parent="group_competition" source="ent_competition" target="ent_judge">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_sub_score" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#AD1457;" edge="1" parent="group_competition" source="ent_submission" target="ent_score">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_judge_score" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#AD1457;" edge="1" parent="group_competition" source="ent_judge" target="ent_score">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_sub_award" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToOne;startArrow=ERzeroToOne;strokeColor=#AD1457;" edge="1" parent="group_competition" source="ent_submission" target="ent_award">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>


        <!-- ==================== GROUP 6: COMMERCE ==================== -->
        <mxCell id="group_commerce" value="6. Commerce" style="swimlane;whiteSpace=wrap;html=1;fillColor=#E0F2F1;strokeColor=#00897B;fontStyle=1;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="540" y="680" width="500" height="340" as="geometry" />
        </mxCell>

        <mxCell id="ent_product" value="Product&#10;------------------&#10;+ id (PK) : INT&#10;book_id (FK) : INT&#10;magazine_id (FK) : INT&#10;sku : VARCHAR&#10;price : DECIMAL" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#B2DFDB;strokeColor=#00695C;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_commerce">
          <mxGeometry x="20" y="50" width="190" height="110" as="geometry" />
        </mxCell>

        <mxCell id="ent_order" value="Order&#10;------------------&#10;+ id (PK) : INT&#10;customer_id (FK) : INT&#10;total_amount : DECIMAL&#10;payment_status : ENUM" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#B2DFDB;strokeColor=#00695C;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_commerce">
          <mxGeometry x="270" y="50" width="200" height="100" as="geometry" />
        </mxCell>

        <mxCell id="ent_order_item" value="OrderItem&#10;------------------&#10;+ order_id (FK) : INT&#10;+ product_id (FK) : INT&#10;quantity : INT&#10;unit_price : DECIMAL" style="shape=rect;whiteSpace=wrap;html=1;fillColor=#B2DFDB;strokeColor=#00695C;align=left;spacingLeft=10;fontFamily=Courier New;fontSize=11;" vertex="1" parent="group_commerce">
          <mxGeometry x="150" y="200" width="200" height="90" as="geometry" />
        </mxCell>

        <mxCell id="edge_order_item" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#00695C;" edge="1" parent="group_commerce" source="ent_order" target="ent_order_item">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="edge_product_item" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#00695C;" edge="1" parent="group_commerce" source="ent_product" target="ent_order_item">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>


        <!-- ==================== CROSS-GROUP RELATIONSHIPS ==================== -->

        <!-- User -> WorkAuthor -->
        <mxCell id="rel_user_workauthor" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#333333;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="ent_user" target="ent_work_author">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="240" y="150" />
              <mxPoint x="240" y="30" />
              <mxPoint x="910" y="30" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Org -> Work -->
        <mxCell id="rel_org_work" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#333333;" edge="1" parent="1" source="ent_org" target="ent_work">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- User -> ReadingLog -->
        <mxCell id="rel_user_readinglog" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#333333;" edge="1" parent="1" source="ent_user" target="ent_reading_log">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="150" y="390" />
              <mxPoint x="820" y="390" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- User -> BookProject -->
        <mxCell id="rel_user_book" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#333333;" edge="1" parent="1" source="ent_user" target="ent_book_project">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Work -> Article -->
        <mxCell id="rel_work_article" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToOne;startArrow=ERzeroToOne;strokeColor=#333333;" edge="1" parent="1" source="ent_work" target="ent_article">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Work -> Submission -->
        <mxCell id="rel_work_sub" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToOne;startArrow=ERoneOnly;strokeColor=#333333;" edge="1" parent="1" source="ent_work" target="ent_submission">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Org -> Competition -->
        <mxCell id="rel_org_comp" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#333333;" edge="1" parent="1" source="ent_org" target="ent_competition">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="440" y="20" />
              <mxPoint x="1180" y="20" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- User -> Judge -->
        <mxCell id="rel_user_judge" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#333333;" edge="1" parent="1" source="ent_user" target="ent_judge">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="100" y="400" />
              <mxPoint x="1060" y="400" />
              <mxPoint x="1060" y="295" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- BookProject -> Product -->
        <mxCell id="rel_book_product" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToOne;startArrow=ERzeroToOne;strokeColor=#333333;" edge="1" parent="1" source="ent_book_project" target="ent_product">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="150" y="870" />
              <mxPoint x="655" y="870" />
            </Array>
          </mxGeometry>
        </mxCell>

        <!-- Magazine -> Product -->
        <mxCell id="rel_mag_product" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERzeroToOne;startArrow=ERzeroToOne;strokeColor=#333333;" edge="1" parent="1" source="ent_magazine" target="ent_product">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- User -> Order -->
        <mxCell id="rel_user_order" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=ERoneToMany;startArrow=ERoneOnly;strokeColor=#333333;" edge="1" parent="1" source="ent_user" target="ent_order">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="20" y="150" />
              <mxPoint x="20" y="1000" />
              <mxPoint x="910" y="1000" />
            </Array>
          </mxGeometry>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>