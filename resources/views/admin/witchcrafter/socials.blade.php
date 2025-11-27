@extends('layouts.witchcrafter', ['sideContent' => false])

@section('title')
    Social Links
@endsection

@section('content')
    <form id="witchcrafterEditor" action="" method="POST" class="h-full flex flex-col">
        @csrf
        @method('PATCH')
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">Social Links</h1>
            <p class="text-zinc-400 text-sm">Configure the Quick Links that appear on the dashboard and console pages.</p>
        </div>
        <div class="flex-1 space-y-6 pb-[80px]">
            <!-- Billing Area -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-300" for="witchcrafter:socialBilling">
                    Billing Area URL
                </label>
                <input type="text" id="witchcrafter:socialBilling" name="witchcrafter:socialBilling"
                    value="{{ old('witchcrafter:socialBilling', config('witchcrafter.socialBilling')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://client.witchyworlds.top" />
            </div>

            <!-- Status Page -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-300" for="witchcrafter:socialStatus">
                    Status Page URL
                </label>
                <input type="text" id="witchcrafter:socialStatus" name="witchcrafter:socialStatus"
                    value="{{ old('witchcrafter:socialStatus', config('witchcrafter.socialStatus')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://status.witchyworlds.top" />
            </div>

            <!-- Discord -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-300" for="witchcrafter:socialDiscord">
                    Discord Invite URL
                </label>
                <input type="text" id="witchcrafter:socialDiscord" name="witchcrafter:socialDiscord"
                    value="{{ old('witchcrafter:socialDiscord', config('witchcrafter.socialDiscord')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://discord.gg/your-invite" />
            </div>

            <!-- Website -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-300" for="witchcrafter:socialWebsite">
                    Website URL
                </label>
                <input type="text" id="witchcrafter:socialWebsite" name="witchcrafter:socialWebsite"
                    value="{{ old('witchcrafter:socialWebsite', config('witchcrafter.socialWebsite')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://witchyworlds.top" />
            </div>

            <!-- Knowledgebase -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-300" for="witchcrafter:socialKnowledgebase">
                    Knowledgebase URL <span class="text-zinc-500 text-xs">(Optional)</span>
                </label>
                <input type="text" id="witchcrafter:socialKnowledgebase" name="witchcrafter:socialKnowledgebase"
                    value="{{ old('witchcrafter:socialKnowledgebase', config('witchcrafter.socialKnowledgebase')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://docs.witchyworlds.top" />
            </div>

            <!-- Custom Link Title -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-300" for="witchcrafter:socialCustomTitle">
                    Custom Link Title <span class="text-zinc-500 text-xs">(Optional)</span>
                </label>
                <input type="text" id="witchcrafter:socialCustomTitle" name="witchcrafter:socialCustomTitle"
                    value="{{ old('witchcrafter:socialCustomTitle', config('witchcrafter.socialCustomTitle')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Trials" />
                <p class="text-xs text-zinc-500 mt-1">The display name for your custom link</p>
            </div>

            <!-- Custom Link URL -->
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-300" for="witchcrafter:socialCustomUrl">
                    Custom Link URL <span class="text-zinc-500 text-xs">(Optional)</span>
                </label>
                <input type="text" id="witchcrafter:socialCustomUrl" name="witchcrafter:socialCustomUrl"
                    value="{{ old('witchcrafter:socialCustomUrl', config('witchcrafter.socialCustomUrl')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://trials.witchyworlds.top" />
                <p class="text-xs text-zinc-500 mt-1">Leave both custom fields empty to hide this link</p>
            </div>
        </div>
    </form>
@endsection
