import React, { useState } from 'react';
import {
  Layers,
  Code2,
  CheckCircle2,
  Server,
  Database,
  Cpu,
  FileCode,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

interface CleanArchitectureVisualizerProps {
  locale: 'ar' | 'en';
}

export const CleanArchitectureVisualizer: React.FC<CleanArchitectureVisualizerProps> = ({ locale }) => {
  const isAr = locale === 'ar';
  const [selectedLayer, setSelectedLayer] = useState<'domain' | 'application' | 'infrastructure' | 'presentation'>('domain');

  const solidPrinciples = [
    {
      code: 'S',
      title: 'Single Responsibility Principle (SRP)',
      arabicTitle: 'مبدأ المسؤولية الواحدة',
      desc: 'فصل المهام بحيث يكون لكل فئة (Class) سبب واحد فقط للتغيير (مثل عزل خدمة توليد الباركود عن خدمة الأرشفة والتوقيع الرقمي).'
    },
    {
      code: 'O',
      title: 'Open/Closed Principle (OCP)',
      arabicTitle: 'مبدأ الانفتاح للتوسيع والانغلاق للتعديل',
      desc: 'إمكانية إضافة قنوات تسليم ومنافذ ربط جديدة (مثل GSB, Email, SMS, Wathiq) عبر واجهات (Interfaces) دون المساس بجوهر النظام.'
    },
    {
      code: 'L',
      title: 'Liskov Substitution Principle (LSP)',
      arabicTitle: 'مبدأ إحلال ليسكوف',
      desc: 'توافق الكائنات المشتقة (مثل المعاملات الواردة والصادرة ومذكرات العرض) مع فئة المعاملة الأساسية ICorrespondenceEntity دون كسر السلوك.'
    },
    {
      code: 'I',
      title: 'Interface Segregation Principle (ISP)',
      arabicTitle: 'مبدأ فصل الواجهات',
      desc: 'تفكيك الواجهات الضخمة إلى عقود متخصصة: ISignableDocument, IRoutableWorkItem, IArchivableEntity.'
    },
    {
      code: 'D',
      title: 'Dependency Inversion Principle (DIP)',
      arabicTitle: 'مبدأ عكس التبعية',
      desc: 'طبقات التطبيق العليا لا تعتمد على التفاصيل الملموسة للبنية التحتية، بل تعتمد على التجريد (Dependency Injection / Inversion of Control).'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>
            {isAr
              ? 'مخطط الهيكلية النظيفة ومبادئ SOLID ونموذج .NET Core C#'
              : '.NET Core Clean Architecture & SOLID Principles'}
          </span>
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
          {isAr
            ? 'الهندسة البرمجية المعتمدة وفق معايير Enterprise Architecture وDomain-Driven Design (DDD)'
            : 'Interactive Clean Architecture layer explorer & SOLID implementation matrix'}
        </p>
      </div>

      {/* Layer Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedLayer('domain')}
          className={`p-4 rounded-2xl border text-start transition cursor-pointer space-y-2 ${
            selectedLayer === 'domain'
              ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
              Layer 1 (Core)
            </span>
            <Database className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs">1. Domain Layer</div>
          <div className="text-[11px] opacity-80">الكيانات، كائنات القيمة، وقواعد الأعمال الصرفة</div>
        </button>

        <button
          onClick={() => setSelectedLayer('application')}
          className={`p-4 rounded-2xl border text-start transition cursor-pointer space-y-2 ${
            selectedLayer === 'application'
              ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
              Layer 2 (CQRS)
            </span>
            <Cpu className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs">2. Application Layer</div>
          <div className="text-[11px] opacity-80">أوامر واستعلامات MediatR، التحقق من الصحة (FluentValidation)</div>
        </button>

        <button
          onClick={() => setSelectedLayer('infrastructure')}
          className={`p-4 rounded-2xl border text-start transition cursor-pointer space-y-2 ${
            selectedLayer === 'infrastructure'
              ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
              Layer 3 (Data/IO)
            </span>
            <Server className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs">3. Infrastructure Layer</div>
          <div className="text-[11px] opacity-80">EF Core، التوقيع الرقمي PKI، الربط الحكومي GSB</div>
        </button>

        <button
          onClick={() => setSelectedLayer('presentation')}
          className={`p-4 rounded-2xl border text-start transition cursor-pointer space-y-2 ${
            selectedLayer === 'presentation'
              ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
              Layer 4 (API/UI)
            </span>
            <Globe className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs">4. Presentation Layer</div>
          <div className="text-[11px] opacity-80">ASP.NET Core Web API Controllers & Enterprise Web Portal</div>
        </button>
      </div>

      {/* Selected Layer Code & Specification Showcase */}
      <div className="bg-slate-900 dark:bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs font-bold text-emerald-400">
              {selectedLayer === 'domain' && 'LinkFlow.Domain / Entities / Correspondence.cs'}
              {selectedLayer === 'application' && 'LinkFlow.Application / Commands / RegisterIncomingCommand.cs'}
              {selectedLayer === 'infrastructure' && 'LinkFlow.Infrastructure / Services / DigitalSignatureService.cs'}
              {selectedLayer === 'presentation' && 'LinkFlow.WebApi / Controllers / CorrespondenceController.cs'}
            </span>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
            C# 12 / .NET 8 / Clean Architecture
          </span>
        </div>

        <pre className="font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto p-4 bg-slate-950 rounded-xl border border-slate-800">
          {selectedLayer === 'domain' &&
            `namespace LinkFlow.Domain.Entities;

public sealed class Correspondence : AggregateRoot<Guid>
{
    public CorrespondenceNumber CorrNumber { get; private set; }
    public Barcode Barcode { get; private set; }
    public string Title { get; private set; }
    public CorrespondenceType Type { get; private set; }
    public PriorityLevel Priority { get; private set; }
    public SecurityLevel Security { get; private set; }
    public ExternalSiteId? OriginSiteId { get; private set; }
    public DateTime RegisteredAt { get; private set; }

    private readonly List<RouteItem> _routes = new();
    public IReadOnlyCollection<RouteItem> Routes => _routes.AsReadOnly();

    public void AddRoute(RouteItem route)
    {
        Guard.Against.Null(route, nameof(route));
        _routes.Add(route);
        AddDomainEvent(new CorrespondenceRoutedEvent(Id, route.Id));
    }
}`}

          {selectedLayer === 'application' &&
            `namespace LinkFlow.Application.Correspondences.Commands;

public sealed record RegisterIncomingCommand(
    string Title,
    int SiteId,
    string ReferenceNo,
    DateTime ReferenceDate,
    DeliveryMethod DeliveryMethod,
    SecurityLevel SecurityLevel,
    PriorityLevel PriorityLevel,
    int? FileFolderId,
    int ExpectedResponseDays
) : IRequest<CorrespondenceDto>;

public sealed class RegisterIncomingCommandHandler 
    : IRequestHandler<RegisterIncomingCommand, CorrespondenceDto>
{
    private readonly ICorrespondenceRepository _repository;
    private readonly IBarcodeGenerator _barcodeGenerator;
    private readonly IUnitOfWork _unitOfWork;

    public async Task<CorrespondenceDto> Handle(RegisterIncomingCommand request, CancellationToken ct)
    {
        var barcode = await _barcodeGenerator.GenerateAsync(CorrespondenceType.Incoming, ct);
        var correspondence = Correspondence.CreateIncoming(request, barcode);
        
        await _repository.AddAsync(correspondence, ct);
        await _unitOfWork.CommitAsync(ct);
        
        return correspondence.ToDto();
    }
}`}

          {selectedLayer === 'infrastructure' &&
            `namespace LinkFlow.Infrastructure.Services;

public sealed class DigitalSignatureService : IDigitalSignatureService
{
    private readonly IPkiCertificateProvider _certificateProvider;
    private readonly IAuditLogger _auditLogger;

    public async Task<DigitalSignatureResult> SignDocumentAsync(byte[] documentBytes, EmployeeId signerId)
    {
        var cert = await _certificateProvider.GetSignerCertificateAsync(signerId);
        var signatureHash = CryptographyUtils.ComputeSha256(documentBytes, cert.PrivateKey);
        
        await _auditLogger.LogSecurityEventAsync("SIGN_DOCUMENT", signerId, signatureHash);
        
        return new DigitalSignatureResult(cert.SignerName, cert.JobTitle, signatureHash, DateTime.UtcNow);
    }
}`}

          {selectedLayer === 'presentation' &&
            `namespace LinkFlow.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class CorrespondenceController : ControllerBase
{
    private readonly IMediator _mediator;

    public CorrespondenceController(IMediator mediator) => _mediator = mediator;

    [HttpPost("incoming")]
    [ProducesResponseType(typeof(CorrespondenceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> RegisterIncoming([FromBody] RegisterIncomingCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}`}
        </pre>
      </div>

      {/* SOLID Principles Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? 'تطبيق مبادئ SOLID الخمسة في المنظومة' : 'SOLID Principles Applied in LinkFlow'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solidPrinciples.map(p => (
            <div key={p.code} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 font-mono font-bold flex items-center justify-center text-xs border border-slate-700">
                  {p.code}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{isAr ? p.arabicTitle : p.title}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">{p.title}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
